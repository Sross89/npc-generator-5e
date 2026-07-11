import { MODULE_ID, ABILITY_KEYS } from "../constants.js";
import { generateNPC, generateNPCFromTemplate } from "../generator.js";
import { getAvailableBundledCRs } from "../statblocks.js";
import { getActorCompendiums, getPackActorIndex } from "../compendium.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const ABILITY_FIELD_MAP = {
  str: "abilStr", dex: "abilDex", con: "abilCon",
  int: "abilInt", wis: "abilWis", cha: "abilCha"
};

function crToLabel(cr) {
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

export class NPCGeneratorApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "npc-generator-5e-app",
    tag: "form",
    window: {
      title: "NPC-GENERATOR-5E.App.Title",
      icon: "fa-solid fa-people-group",
      contentClasses: ["npc-generator-5e"]
    },
    position: { width: 460, height: "auto" },
    form: {
      handler: NPCGeneratorApp.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: false
    },
    actions: {}
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/npc-generator.hbs` }
  };

  /** Cache of the last-fetched pack index, keyed by packId, so actor selection needs no re-fetch. */
  #indexCache = new Map();

  _onRender(context, options) {
    super._onRender(context, options);

    const sourceModeSelect = this.element.querySelector('select[name="sourceMode"]');
    const crModeSelect = this.element.querySelector('select[name="crMode"]');
    const exactRows = this.element.querySelectorAll(".npc-gen-cr-exact");
    const rangeRows = this.element.querySelectorAll(".npc-gen-cr-range");
    const randomModeSection = this.element.querySelector(".npc-gen-mode-random");
    const templateModeSection = this.element.querySelector(".npc-gen-mode-template");
    const cultureFieldset = this.element.querySelector(".npc-gen-culture-fieldset");
    const nameModeSelect = this.element.querySelector('select[name="nameMode"]');
    const customNameRow = this.element.querySelector(".npc-gen-name-custom");
    const packSelect = this.element.querySelector('select[name="packId"]');
    const actorSelect = this.element.querySelector('select[name="actorId"]');
    const preview = this.element.querySelector("#npc-gen-actor-preview");
    const acOverride = this.element.querySelector("#npc-gen-ac-override");
    const hpOverride = this.element.querySelector("#npc-gen-hp-override");

    const applyCRVisibility = () => {
      const mode = crModeSelect.value;
      exactRows.forEach(row => row.classList.toggle("hidden", mode !== "exact"));
      rangeRows.forEach(row => row.classList.toggle("hidden", mode !== "range"));
    };

    const applySourceVisibility = () => {
      const isTemplate = sourceModeSelect.value === "template";
      randomModeSection.classList.toggle("hidden", isTemplate);
      templateModeSection.classList.toggle("hidden", !isTemplate);
      const showCulture = !isTemplate || nameModeSelect.value === "random";
      cultureFieldset.classList.toggle("hidden", !showCulture);
    };

    const applyNameModeVisibility = () => {
      customNameRow.classList.toggle("hidden", nameModeSelect.value !== "custom");
      applySourceVisibility();
    };

    const clearActorSelect = (placeholderKey) => {
      actorSelect.innerHTML = `<option value="">${game.i18n.localize(placeholderKey)}</option>`;
      actorSelect.disabled = true;
      preview.innerHTML = "";
      preview.classList.remove("active");
      [acOverride, hpOverride].forEach(el => (el.placeholder = ""));
      ABILITY_KEYS.forEach(key => {
        const el = this.element.querySelector(`input[name="${ABILITY_FIELD_MAP[key]}"]`);
        if (el) el.placeholder = "";
      });
    };

    const onPackChange = async () => {
      const packId = packSelect.value;
      if (!packId) {
        clearActorSelect("NPC-GENERATOR-5E.App.SelectCompendiumFirst");
        return;
      }
      actorSelect.disabled = true;
      actorSelect.innerHTML = `<option value="">${game.i18n.localize("NPC-GENERATOR-5E.App.LoadingActors")}</option>`;

      let index = this.#indexCache.get(packId);
      if (!index) {
        index = await getPackActorIndex(packId);
        this.#indexCache.set(packId, index);
      }

      if (!index.length) {
        clearActorSelect("NPC-GENERATOR-5E.App.NoActorsInCompendium");
        return;
      }

      actorSelect.innerHTML = index.map(entry =>
        `<option value="${entry.id}">${entry.name}${entry.cr !== null ? ` (CR ${crToLabel(entry.cr)})` : ""}</option>`
      ).join("");
      actorSelect.disabled = false;
      onActorChange();
    };

    const onActorChange = () => {
      const packId = packSelect.value;
      const index = this.#indexCache.get(packId) ?? [];
      const entry = index.find(e => e.id === actorSelect.value);

      if (!entry) {
        preview.innerHTML = "";
        preview.classList.remove("active");
        return;
      }

      preview.classList.add("active");
      preview.innerHTML = entry.img ? `<img src="${entry.img}" alt="${entry.name}" />` : "";

      ABILITY_KEYS.forEach(key => {
        const el = this.element.querySelector(`input[name="${ABILITY_FIELD_MAP[key]}"]`);
        if (el) el.placeholder = entry.abilities?.[key]?.value ?? "10";
      });
      acOverride.placeholder = entry.ac ?? "";
      hpOverride.placeholder = entry.hp ?? "";
    };

    sourceModeSelect.addEventListener("change", applySourceVisibility);
    crModeSelect.addEventListener("change", applyCRVisibility);
    nameModeSelect.addEventListener("change", applyNameModeVisibility);
    packSelect.addEventListener("change", onPackChange);
    actorSelect.addEventListener("change", onActorChange);

    applyCRVisibility();
    applySourceVisibility();
    applyNameModeVisibility();
  }

  async _prepareContext() {
    const crOptions = await getAvailableBundledCRs();
    return {
      crModes: [
        { value: "exact", label: game.i18n.localize("NPC-GENERATOR-5E.App.ExactCR") },
        { value: "range", label: game.i18n.localize("NPC-GENERATOR-5E.App.RangeCR") },
        { value: "any", label: game.i18n.localize("NPC-GENERATOR-5E.App.AnyCR") }
      ],
      crOptions: crOptions.map(cr => ({ value: cr, label: crToLabel(cr) })),
      cultures: ["human", "elf", "dwarf", "halfling", "orcish"],
      compendiums: getActorCompendiums()
    };
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;

    if (data.sourceMode === "template") {
      if (!data.packId || !data.actorId) {
        ui.notifications.warn(game.i18n.localize("NPC-GENERATOR-5E.Warnings.NoTemplateSelected"));
        return;
      }

      const abilityOverrides = {};
      for (const [key, field] of Object.entries(ABILITY_FIELD_MAP)) {
        if (data[field] !== "" && data[field] !== undefined) abilityOverrides[key] = data[field];
      }

      const params = {
        packId: data.packId,
        actorId: data.actorId,
        nameMode: data.nameMode,
        customName: data.customName,
        abilityOverrides,
        acOverride: data.acOverride,
        hpOverride: data.hpOverride,
        includeItems: !!data.includeItems,
        keepArtwork: !!data.keepArtwork,
        renderSheet: true
      };
      if (data.culture && data.culture !== "random") params.culture = data.culture;

      const actor = await generateNPCFromTemplate(params);
      if (actor) ui.notifications.info(game.i18n.format("NPC-GENERATOR-5E.App.Created", { name: actor.name }));
      return;
    }

    const params = { renderSheet: true };
    if (data.crMode === "exact" && data.exactCR !== "") {
      params.exactCR = Number(data.exactCR);
    } else if (data.crMode === "range") {
      if (data.minCR !== "") params.minCR = Number(data.minCR);
      if (data.maxCR !== "") params.maxCR = Number(data.maxCR);
    }
    if (data.culture && data.culture !== "random") params.culture = data.culture;

    const actor = await generateNPC(params);
    if (actor) {
      ui.notifications.info(game.i18n.format("NPC-GENERATOR-5E.App.Created", { name: actor.name }));
    }
  }
}
