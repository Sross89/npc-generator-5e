import { MODULE_ID, SETTINGS, ABILITY_KEYS } from "../constants.js";
import {
  rollDraftRandom, rollDraftFromTemplate, rollDraftFromArchetype, rerollName, rerollGender,
  rerollOccupation, rerollAbilities, rerollStatSheet, rerollPersonality, rerollInventory,
  rerollAllDraftFields, applySpecies, rerollSpecies, setSpecies, getConfiguredSpeciesPool,
  applyInventoryItems, addInventoryItem
} from "../draft.js";
import { createActorFromDraft } from "../generator.js";
import { getAvailableBundledCRs } from "../statblocks.js";
import { getActorCompendiums, getPackActorIndex } from "../compendium.js";
import { getOccupationThemes } from "../data/occupations.js";
import { getArchetypeOptions } from "../data/archetypes.js";
import { getCRProfileOptions } from "../data/cr-profiles.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const SELECTION_SEP = "::";

function crToLabel(cr) {
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

/** Group a flat pool of { packId, itemId, name } entries into per-compendium option groups for a <select>. */
function groupPoolByPack(pool) {
  const groups = [];
  const byPack = new Map();
  for (const entry of pool ?? []) {
    if (!byPack.has(entry.packId)) byPack.set(entry.packId, []);
    byPack.get(entry.packId).push(entry);
  }
  for (const [packId, entries] of byPack) {
    groups.push({
      label: game.packs.get(packId)?.title ?? packId,
      entries: entries.map(e => ({ value: `${e.packId}${SELECTION_SEP}${e.itemId}`, name: e.name }))
    });
  }
  return groups;
}

export class NPCGeneratorApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "npc-generator-5e-app",
    tag: "div",
    window: {
      title: "NPC-GENERATOR-5E.App.Title",
      icon: "fa-solid fa-people-group",
      contentClasses: ["npc-generator-5e"]
    },
    position: { width: 520, height: "auto" }
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/npc-generator.hbs` }
  };

  /** Cache of the last-fetched compendium index, keyed by packId (Choose a Specific Actor mode). */
  #indexCache = new Map();

  /** The current draft NPC being reviewed, or null while on the setup screen. */
  #draft = null;

  #setup = {
    sourceMode: "random",
    crMode: "any", exactCR: "", minCR: "", maxCR: "",
    culture: "", theme: "",
    packId: "", actorId: "",
    archetypeId: "", archetypeCR: "1",
    speciesSelection: "random"
  };

  async _prepareContext() {
    const crOptions = await getAvailableBundledCRs();
    const enabledPacks = game.settings.get(MODULE_ID, SETTINGS.ENABLED_TEMPLATE_COMPENDIUMS) ?? [];
    const speciesGroups = groupPoolByPack(await getConfiguredSpeciesPool());

    const context = {
      crModes: [
        { value: "exact", label: game.i18n.localize("NPC-GENERATOR-5E.App.ExactCR") },
        { value: "range", label: game.i18n.localize("NPC-GENERATOR-5E.App.RangeCR") },
        { value: "any", label: game.i18n.localize("NPC-GENERATOR-5E.App.AnyCR") }
      ],
      crOptions: crOptions.map(cr => ({ value: cr, label: crToLabel(cr) })),
      cultures: ["human", "elf", "dwarf", "halfling", "orcish"],
      themes: getOccupationThemes(),
      compendiums: getActorCompendiums().map(pack => ({ ...pack, checked: enabledPacks.includes(pack.id) })),
      archetypes: getArchetypeOptions(),
      archetypeCROptions: getCRProfileOptions(),
      speciesGroups,
      hasSpeciesConfigured: !!speciesGroups.length,
      draft: null
    };

    if (this.#draft) context.draft = this.#buildDraftContext();
    return context;
  }

  #buildDraftContext() {
    const draft = this.#draft;
    let chassisLabel, cr;
    if (draft.chassis.type === "bundled") {
      chassisLabel = draft.chassis.statblock.name;
      cr = draft.chassis.statblock.cr;
    } else if (draft.chassis.type === "archetype") {
      chassisLabel = draft.chassis.label;
      cr = draft.chassis.cr;
    } else {
      chassisLabel = draft.chassis.sourceActor.name;
      cr = draft.chassis.sourceActor.system?.details?.cr;
    }

    return {
      chassisLabel,
      crLabel: cr !== undefined && cr !== null ? crToLabel(cr) : "?",
      canRerollStatSheet: !!draft.pool?.length || draft.chassis.type === "archetype",
      isCompendium: draft.chassis.type === "compendium",
      name: draft.name,
      gender: draft.gender,
      theme: draft.theme ?? "",
      occupation: draft.occupation,
      abilitiesList: ABILITY_KEYS.map(key => ({ key, label: key.toUpperCase(), value: draft.abilities[key] })),
      stats: draft.stats,
      personality: draft.personality,
      inventoryIsItems: draft.inventoryMode === "items",
      inventory: draft.inventory.map((text, index) => ({ index, text })),
      inventoryItemRows: (draft.inventoryItems ?? []).map((item, index) => ({ index, name: item.name })),
      coin: draft.coin,
      includeItems: draft.includeItems,
      keepArtwork: draft.keepArtwork,
      species: draft.species ? { name: draft.species.name, img: draft.species.img } : null,
      hasSpeciesPool: !!draft.speciesPool?.length,
      speciesGroups: groupPoolByPack(draft.speciesPool)
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    if (this.#draft) this.#wireReview();
    else this.#wireSetup();
  }

  // ---------------------------------------------------------------------
  // Setup screen
  // ---------------------------------------------------------------------

  #wireSetup() {
    const el = this.element;
    const sourceModeSelect = el.querySelector('select[name="sourceMode"]');
    const crModeSelect = el.querySelector('select[name="crMode"]');
    const exactRows = el.querySelectorAll(".npc-gen-cr-exact");
    const rangeRows = el.querySelectorAll(".npc-gen-cr-range");
    const randomModeSection = el.querySelector(".npc-gen-mode-random");
    const templateModeSection = el.querySelector(".npc-gen-mode-template");
    const archetypeModeSection = el.querySelector(".npc-gen-mode-archetype");
    const packCheckboxes = () => Array.from(el.querySelectorAll(".npc-gen-pack-checkbox"));
    const actorSelect = el.querySelector('select[name="actorSelection"]');
    const preview = el.querySelector("#npc-gen-actor-preview");
    const cultureSelect = el.querySelector('select[name="culture"]');
    const themeSelect = el.querySelector('select[name="theme"]');
    const archetypeSelect = el.querySelector('select[name="archetypeId"]');
    const archetypeCRSelect = el.querySelector('select[name="archetypeCR"]');
    const speciesSelect = el.querySelector('select[name="speciesSelection"]');
    const rollButton = el.querySelector('[data-action="roll"]');

    const applyCRVisibility = () => {
      const mode = crModeSelect.value;
      exactRows.forEach(row => row.classList.toggle("hidden", mode !== "exact"));
      rangeRows.forEach(row => row.classList.toggle("hidden", mode !== "range"));
    };

    const applySourceVisibility = () => {
      const mode = sourceModeSelect.value;
      randomModeSection.classList.toggle("hidden", mode !== "random");
      templateModeSection.classList.toggle("hidden", mode !== "template");
      archetypeModeSection.classList.toggle("hidden", mode !== "archetype");
    };

    const clearActorSelect = (placeholderKey) => {
      actorSelect.innerHTML = `<option value="">${game.i18n.localize(placeholderKey)}</option>`;
      actorSelect.disabled = true;
      preview.innerHTML = "";
      preview.classList.remove("active");
    };

    const findEntry = (selectionValue) => {
      const [packId, actorId] = (selectionValue || "").split(SELECTION_SEP);
      const index = this.#indexCache.get(packId) ?? [];
      return index.find(e => e.id === actorId);
    };

    const onActorChange = () => {
      const entry = findEntry(actorSelect.value);
      this.#setup.packId = entry ? (actorSelect.value.split(SELECTION_SEP)[0]) : "";
      this.#setup.actorId = entry?.id ?? "";
      if (!entry) {
        preview.innerHTML = "";
        preview.classList.remove("active");
        return;
      }
      preview.classList.add("active");
      preview.innerHTML = entry.img ? `<img src="${entry.img}" alt="${entry.name}" />` : "";
    };

    const refreshActorOptions = async () => {
      const checkedPacks = packCheckboxes().filter(cb => cb.checked).map(cb => cb.value);
      game.settings.set(MODULE_ID, SETTINGS.ENABLED_TEMPLATE_COMPENDIUMS, checkedPacks);

      if (!checkedPacks.length) {
        clearActorSelect("NPC-GENERATOR-5E.App.SelectCompendiumFirst");
        return;
      }

      const previousSelection = actorSelect.value;
      actorSelect.disabled = true;
      actorSelect.innerHTML = `<option value="">${game.i18n.localize("NPC-GENERATOR-5E.App.LoadingActors")}</option>`;

      const groups = [];
      for (const packId of checkedPacks) {
        let index = this.#indexCache.get(packId);
        if (!index) {
          index = await getPackActorIndex(packId);
          this.#indexCache.set(packId, index);
        }
        if (index.length) {
          const pack = game.packs.get(packId);
          groups.push({ packId, label: pack?.title ?? packId, entries: index });
        }
      }

      if (!groups.length) {
        clearActorSelect("NPC-GENERATOR-5E.App.NoActorsInCompendium");
        return;
      }

      actorSelect.innerHTML = groups.map(group => `
        <optgroup label="${group.label}">
          ${group.entries.map(entry => {
            const value = `${group.packId}${SELECTION_SEP}${entry.id}`;
            const crText = entry.cr !== null ? ` (CR ${crToLabel(entry.cr)})` : "";
            return `<option value="${value}">${entry.name}${crText}</option>`;
          }).join("")}
        </optgroup>
      `).join("");
      actorSelect.disabled = false;

      if (findEntry(previousSelection)) actorSelect.value = previousSelection;
      onActorChange();
    };

    sourceModeSelect.value = this.#setup.sourceMode;
    crModeSelect.value = this.#setup.crMode;
    if (cultureSelect) cultureSelect.value = this.#setup.culture;
    if (themeSelect) themeSelect.value = this.#setup.theme;
    if (archetypeSelect) archetypeSelect.value = this.#setup.archetypeId;
    if (archetypeCRSelect) archetypeCRSelect.value = this.#setup.archetypeCR;
    if (speciesSelect) speciesSelect.value = this.#setup.speciesSelection;
    const exactCRSelect = el.querySelector('select[name="exactCR"]');
    const minCRSelect = el.querySelector('select[name="minCR"]');
    const maxCRSelect = el.querySelector('select[name="maxCR"]');
    if (exactCRSelect) exactCRSelect.value = this.#setup.exactCR;
    if (minCRSelect) minCRSelect.value = this.#setup.minCR;
    if (maxCRSelect) maxCRSelect.value = this.#setup.maxCR;

    sourceModeSelect.addEventListener("change", () => {
      this.#setup.sourceMode = sourceModeSelect.value;
      applySourceVisibility();
    });
    crModeSelect.addEventListener("change", () => {
      this.#setup.crMode = crModeSelect.value;
      applyCRVisibility();
    });
    exactCRSelect?.addEventListener("change", e => (this.#setup.exactCR = e.target.value));
    minCRSelect?.addEventListener("change", e => (this.#setup.minCR = e.target.value));
    maxCRSelect?.addEventListener("change", e => (this.#setup.maxCR = e.target.value));
    cultureSelect?.addEventListener("change", e => (this.#setup.culture = e.target.value));
    themeSelect?.addEventListener("change", e => (this.#setup.theme = e.target.value));
    archetypeSelect?.addEventListener("change", e => (this.#setup.archetypeId = e.target.value));
    archetypeCRSelect?.addEventListener("change", e => (this.#setup.archetypeCR = e.target.value));
    speciesSelect?.addEventListener("change", e => (this.#setup.speciesSelection = e.target.value));
    packCheckboxes().forEach(cb => cb.addEventListener("change", refreshActorOptions));
    actorSelect.addEventListener("change", onActorChange);
    rollButton.addEventListener("click", () => this.#onRoll());

    applyCRVisibility();
    applySourceVisibility();
    if (packCheckboxes().some(cb => cb.checked)) refreshActorOptions();
  }

  async #onRoll() {
    const {
      sourceMode, crMode, exactCR, minCR, maxCR, culture, theme,
      packId, actorId, archetypeId, archetypeCR, speciesSelection
    } = this.#setup;
    const baseParams = { culture: culture || null, theme: theme || null };

    let draft;
    if (sourceMode === "template") {
      if (!packId || !actorId) {
        ui.notifications.warn(game.i18n.localize("NPC-GENERATOR-5E.Warnings.NoTemplateSelected"));
        return;
      }
      draft = await rollDraftFromTemplate({ packId, actorId, ...baseParams });
      if (!draft) ui.notifications.warn(game.i18n.localize("NPC-GENERATOR-5E.Warnings.TemplateNotFound"));
    } else if (sourceMode === "archetype") {
      if (!archetypeId) {
        ui.notifications.warn(game.i18n.localize("NPC-GENERATOR-5E.Warnings.NoArchetypeSelected"));
        return;
      }
      draft = await rollDraftFromArchetype({ archetypeId, cr: Number(archetypeCR), ...baseParams });
    } else {
      const params = { ...baseParams };
      if (crMode === "exact" && exactCR !== "") params.exactCR = Number(exactCR);
      else if (crMode === "range") {
        if (minCR !== "") params.minCR = Number(minCR);
        if (maxCR !== "") params.maxCR = Number(maxCR);
      }
      draft = await rollDraftRandom(params);
      if (!draft) ui.notifications.warn(game.i18n.localize("NPC-GENERATOR-5E.Warnings.NoMatch"));
    }

    if (!draft) return;

    let selection = "random";
    if (speciesSelection === "none") selection = "none";
    else if (speciesSelection && speciesSelection !== "random") {
      const [speciesPackId, speciesItemId] = speciesSelection.split(SELECTION_SEP);
      selection = { packId: speciesPackId, itemId: speciesItemId };
    }
    await applySpecies(draft, selection);
    await applyInventoryItems(draft);

    this.#draft = draft;
    this.render();
  }

  // ---------------------------------------------------------------------
  // Review screen
  // ---------------------------------------------------------------------

  #wireReview() {
    const el = this.element;

    const genderSelect = el.querySelector('select[data-field="gender"]');
    if (genderSelect) genderSelect.value = this.#draft.gender;
    const themeSelect = el.querySelector('select[data-field="theme"]');
    if (themeSelect) themeSelect.value = this.#draft.theme ?? "";

    const speciesSelect = el.querySelector("[data-species-select]");
    if (speciesSelect) {
      speciesSelect.value = this.#draft.species?.sourceItem
        ? `${this.#draft.species.sourceItem.pack}${SELECTION_SEP}${this.#draft.species.sourceItem.id}`
        : "none";
      speciesSelect.addEventListener("change", async () => {
        if (speciesSelect.value === "none") await setSpecies(this.#draft, null);
        else {
          const [packId, itemId] = speciesSelect.value.split(SELECTION_SEP);
          await setSpecies(this.#draft, { packId, itemId });
        }
        this.render();
      });
    }

    el.querySelectorAll("[data-field]").forEach(input => {
      const path = input.dataset.field;
      const eventName = input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener(eventName, () => {
        const value = input.type === "checkbox" ? input.checked : input.value;
        foundry.utils.setProperty(this.#draft, path, value);
      });
    });

    el.querySelectorAll("[data-inventory-index]").forEach(input => {
      input.addEventListener("input", () => {
        this.#draft.inventory[Number(input.dataset.inventoryIndex)] = input.value;
      });
    });

    el.querySelectorAll("[data-remove-item]").forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.removeItem);
        if (this.#draft.inventoryMode === "items") this.#draft.inventoryItems.splice(index, 1);
        else this.#draft.inventory.splice(index, 1);
        this.render();
      });
    });

    el.querySelector('[data-action="add-item"]')?.addEventListener("click", async () => {
      if (this.#draft.inventoryMode === "items") await addInventoryItem(this.#draft);
      else this.#draft.inventory.push("");
      this.render();
    });

    const reroll = (fn, needsAsync = false) => async () => {
      if (needsAsync) await fn(this.#draft);
      else fn(this.#draft);
      this.render();
    };

    el.querySelector('[data-action="reroll-name"]')?.addEventListener("click", reroll(rerollName, true));
    el.querySelector('[data-action="reroll-gender"]')?.addEventListener("click", reroll(rerollGender));
    el.querySelector('[data-action="reroll-occupation"]')?.addEventListener("click", reroll(rerollOccupation));
    el.querySelector('[data-action="reroll-abilities"]')?.addEventListener("click", reroll(rerollAbilities));
    el.querySelector('[data-action="reroll-stats"]')?.addEventListener("click", reroll(rerollStatSheet, true));
    el.querySelector('[data-action="reroll-personality"]')?.addEventListener("click", reroll(rerollPersonality));
    el.querySelector('[data-action="reroll-inventory"]')?.addEventListener("click", reroll(rerollInventory, true));
    el.querySelector('[data-action="reroll-species"]')?.addEventListener("click", reroll(rerollSpecies, true));
    el.querySelector('[data-action="reroll-all"]')?.addEventListener("click", reroll(rerollAllDraftFields, true));

    el.querySelector('[data-action="back"]')?.addEventListener("click", () => {
      this.#draft = null;
      this.render();
    });

    el.querySelector('[data-action="create"]')?.addEventListener("click", () => this.#onCreate());
  }

  async #onCreate() {
    const draft = this.#draft;
    const actor = await createActorFromDraft(draft, true);
    if (actor) {
      ui.notifications.info(game.i18n.format("NPC-GENERATOR-5E.App.Created", { name: actor.name }));
      this.#draft = null;
      this.render();
    }
  }
}
