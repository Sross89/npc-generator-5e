import { SIZE_MAP, SKILL_KEY_MAP, ABILITY_KEYS } from "./constants.js";
import { rollDraftRandom, rollDraftFromTemplate, rollDraftFromArchetype } from "./draft.js";

const DEFAULT_IMG = "icons/svg/mystery-man.svg";

function parseDarkvision(sensesText = "") {
  const match = /darkvision (\d+)\s*ft/i.exec(sensesText);
  return match ? Number(match[1]) : 0;
}

function buildSkills(statblock) {
  const skills = {};
  for (const [name, bonus] of Object.entries(statblock.skills ?? {})) {
    const key = SKILL_KEY_MAP[name.toLowerCase()];
    if (!key) continue;
    skills[key] = { value: 1, bonuses: { check: "", passive: "" } };
    void bonus; // SRD flat bonus is preserved as text in the biography; exact prof math is left to the sheet.
  }
  return skills;
}

function formatActionText(action) {
  if (action.description) return action.description;
  const parts = [];
  if (action.type === "mwak" || action.type === "rwak") {
    const kind = action.type === "mwak" ? "Melee Weapon Attack" : "Ranged Weapon Attack";
    const where = action.reach ? `reach ${action.reach}` : action.range ? `range ${action.range}` : "";
    parts.push(`${kind}: +${action.attackBonus ?? 0} to hit, ${where}, ${action.targets ?? "one target"}.`);
  }
  if (action.damage?.length) {
    const dmg = action.damage.map(d => `${d.formula} ${d.type}`).join(" plus ");
    parts.push(`Hit: ${dmg} damage.`);
  }
  return parts.join(" ");
}

/**
 * Best-effort mapping of a statblock action into a dnd5e v3+ Activities entry.
 * Wrapped by the caller in try/catch — if the host system's schema has moved on,
 * the item still ships with full, correctly formatted SRD text in its description.
 */
function buildActivity(action) {
  const id = foundry.utils.randomID();
  const activity = {
    _id: id,
    type: action.damage?.length ? "attack" : "utility",
    activation: { type: "action", value: 1 },
    description: { chatFlavor: "" }
  };

  if (action.type === "mwak" || action.type === "rwak") {
    activity.attack = {
      ability: action.type === "mwak" ? "str" : "dex",
      bonus: "",
      flat: true,
      type: { value: action.type === "mwak" ? "melee" : "ranged", classification: "weapon" }
    };
    activity.range = action.type === "mwak"
      ? { units: "ft", value: Number(action.reach) || 5 }
      : { units: "ft", value: Number((action.range || "").split("/")[0]) || 30 };
  }

  if (action.damage?.length) {
    activity.damage = {
      includeBase: false,
      parts: action.damage.map(d => ({
        custom: { enabled: true, formula: d.formula },
        types: [d.type]
      }))
    };
  }

  return { [id]: activity };
}

/**
 * Build the embedded Item data (weapons/features) for a bundled statblock's traits and actions.
 * @param {object} statblock
 * @returns {object[]}
 */
function buildItems(statblock) {
  const items = [];

  for (const trait of statblock.traits ?? []) {
    items.push({
      name: trait.name,
      type: "feat",
      system: {
        description: { value: `<p>${trait.description}</p>` },
        type: { value: "monster" },
        activation: { type: "" }
      }
    });
  }

  for (const action of statblock.actions ?? []) {
    const isAttack = action.type === "mwak" || action.type === "rwak";
    const item = {
      name: action.name,
      type: isAttack ? "weapon" : "feat",
      system: {
        description: { value: `<p>${formatActionText(action)}</p>` },
        activation: { type: "action", value: 1 }
      }
    };
    if (isAttack) {
      item.system.type = { value: "natural" };
      item.system.proficient = true;
      item.system.equipped = true;
    }
    try {
      item.system.activities = buildActivity(action);
    } catch (err) {
      console.warn(`NPC-GENERATOR-5E | Could not build a structured activity for "${action.name}"; description text is still fully populated.`, err);
    }
    items.push(item);
  }

  return items;
}

function sourceLabelFor(draft) {
  if (draft.chassis.type === "bundled") return draft.chassis.statblock.source;
  if (draft.chassis.type === "archetype") return `Quick template: ${draft.chassis.label}`;
  return `Compendium template: ${draft.chassis.sourceActor.name}`;
}

function inventoryLineFor(draft) {
  if (draft.inventoryMode === "items") {
    const names = (draft.inventoryItems ?? []).map(i => i.name);
    if (draft.coin) names.push(draft.coin);
    return names;
  }
  return draft.inventory ?? [];
}

function buildBiography(draft) {
  const sourceLabel = sourceLabelFor(draft);
  const { personality } = draft;
  const lines = [`<p><strong>Source:</strong> ${sourceLabel}</p>`];
  if (draft.species) lines.push(`<p><strong>Species:</strong> ${draft.species.name}</p>`);
  lines.push(
    `<p><strong>Occupation:</strong> ${draft.occupation}</p>`,
    `<p><strong>Personality:</strong> ${personality.personalityTrait}</p>`,
    `<p><strong>Ideal:</strong> ${personality.ideal}</p>`,
    `<p><strong>Bond:</strong> ${personality.bond}</p>`,
    `<p><strong>Flaw:</strong> ${personality.flaw}</p>`,
    `<p><strong>Quirk:</strong> ${personality.quirk}</p>`
  );
  const inventoryLine = inventoryLineFor(draft);
  if (inventoryLine.length) {
    lines.push(`<p><strong>Inventory:</strong> ${inventoryLine.join(", ")}</p>`);
  }
  return lines.join("\n");
}

function buildAbilitiesData(draft) {
  const abilities = {};
  for (const key of ABILITY_KEYS) abilities[key] = { value: Number(draft.abilities[key]) || 10 };
  return abilities;
}

/**
 * The linked Species/Race item's raw data, ready to embed. Always included regardless
 * of the "Include Weapons & Features" toggle — species is identity, not gear.
 */
function speciesItems(draft) {
  if (!draft.species?.sourceItem) return [];
  const data = draft.species.sourceItem.toObject();
  delete data._id;
  return [data];
}

/** Real Item documents carried in inventory (Items compendium linking), ready to embed. */
function inventoryItemsData(draft) {
  if (draft.inventoryMode !== "items") return [];
  return (draft.inventoryItems ?? []).map(({ sourceItem }) => {
    const data = sourceItem.toObject();
    delete data._id;
    return data;
  });
}

function buildActorDataFromBundledDraft(draft) {
  const statblock = draft.chassis.statblock;

  return {
    name: draft.name,
    type: "npc",
    items: [
      ...(draft.includeItems ? buildItems(statblock) : []),
      ...speciesItems(draft),
      ...inventoryItemsData(draft)
    ],
    system: {
      abilities: buildAbilitiesData(draft),
      attributes: {
        ac: { flat: Number(draft.stats.ac), calc: "flat" },
        hp: { value: Number(draft.stats.hp), max: Number(draft.stats.hp), formula: statblock.hp.formula },
        movement: { walk: Number(draft.stats.speed), units: "ft" },
        senses: { darkvision: parseDarkvision(draft.stats.senses), special: draft.stats.senses ?? "" }
      },
      details: {
        cr: statblock.cr,
        type: { value: statblock.type, subtype: statblock.subtype ?? "" },
        alignment: statblock.alignment,
        biography: { value: buildBiography(draft) }
      },
      traits: {
        size: SIZE_MAP[statblock.size] ?? "med",
        languages: { value: [], custom: statblock.languages ?? "" }
      },
      skills: buildSkills(statblock)
    }
  };
}

function buildActorDataFromCompendiumDraft(draft) {
  const data = draft.chassis.sourceActor.toObject();
  delete data._id;
  data.name = draft.name;

  for (const key of ABILITY_KEYS) {
    foundry.utils.setProperty(data, `system.abilities.${key}.value`, Number(draft.abilities[key]) || 10);
  }

  foundry.utils.setProperty(data, "system.attributes.ac.flat", Number(draft.stats.ac));
  foundry.utils.setProperty(data, "system.attributes.ac.calc", "flat");
  foundry.utils.setProperty(data, "system.attributes.hp.value", Number(draft.stats.hp));
  foundry.utils.setProperty(data, "system.attributes.hp.max", Number(draft.stats.hp));
  foundry.utils.setProperty(data, "system.attributes.movement.walk", Number(draft.stats.speed));
  foundry.utils.setProperty(data, "system.attributes.senses.darkvision", parseDarkvision(draft.stats.senses));
  foundry.utils.setProperty(data, "system.attributes.senses.special", draft.stats.senses ?? "");

  if (!draft.includeItems) data.items = [];
  data.items = [...data.items, ...speciesItems(draft), ...inventoryItemsData(draft)];

  if (!draft.keepArtwork) {
    data.img = DEFAULT_IMG;
    foundry.utils.setProperty(data, "prototypeToken.texture.src", DEFAULT_IMG);
  }

  const existingBio = foundry.utils.getProperty(data, "system.details.biography.value") ?? "";
  foundry.utils.setProperty(data, "system.details.biography.value", `${existingBio}\n${buildBiography(draft)}`);

  return data;
}

/** Map a Quick Template archetype's weapon options into the same shape buildItems() expects. */
function archetypeToActions(chassis) {
  return chassis.attacks.map(atk => ({
    name: atk.name,
    type: atk.type,
    attackBonus: chassis.attackBonus,
    reach: atk.reach,
    range: atk.range,
    targets: "one target",
    damage: [{ formula: `${atk.die}+${chassis.damageBonus}`, type: atk.damageType }]
  }));
}

/**
 * Map a Quick Template archetype's rolled spell package into a flavor-text Spellcasting
 * trait. Only used as a fallback when no real Spell items were linked via Settings —
 * see spellItemsData() for the real-item path.
 */
function archetypeToTraits(chassis) {
  if (!chassis.spellPackage) return [];
  const { cantrips, spells } = chassis.spellPackage;
  const spellLine = spells.length ? ` Also prepared: ${spells.join(", ")}.` : "";
  return [{
    name: "Spellcasting",
    description: `${chassis.label} is a spellcaster (spell save DC ${chassis.saveDC}). Known cantrips: ${cantrips.join(", ")}.${spellLine}`
  }];
}

/** Real Spell item documents linked via Settings, ready to embed. */
function spellItemsData(chassis) {
  if (!chassis.spellItems?.length) return [];
  return chassis.spellItems.map(({ sourceItem }) => {
    const data = sourceItem.toObject();
    delete data._id;
    return data;
  });
}

function buildActorDataFromArchetypeDraft(draft) {
  const chassis = draft.chassis;
  const pseudoStatblock = { traits: archetypeToTraits(chassis), actions: archetypeToActions(chassis) };

  const data = {
    name: draft.name,
    type: "npc",
    items: [
      ...(draft.includeItems ? buildItems(pseudoStatblock) : []),
      ...speciesItems(draft),
      ...spellItemsData(chassis),
      ...inventoryItemsData(draft)
    ],
    system: {
      abilities: buildAbilitiesData(draft),
      attributes: {
        ac: { flat: Number(draft.stats.ac), calc: "flat" },
        hp: { value: Number(draft.stats.hp), max: Number(draft.stats.hp), formula: "" },
        movement: { walk: Number(draft.stats.speed), units: "ft" },
        senses: { darkvision: parseDarkvision(draft.stats.senses), special: draft.stats.senses ?? "" }
      },
      details: {
        cr: chassis.cr,
        type: { value: "humanoid", subtype: "any race" },
        alignment: "any alignment",
        biography: { value: buildBiography(draft) }
      },
      traits: {
        size: "med",
        languages: { value: [], custom: "Common" }
      },
      skills: {}
    }
  };

  if (chassis.casterAbility) data.system.attributes.spellcasting = chassis.casterAbility;

  return data;
}

/**
 * Convert a fully-reviewed draft into Foundry Actor create data.
 * @param {object} draft
 * @returns {object}
 */
export function draftToActorData(draft) {
  if (draft.chassis.type === "bundled") return buildActorDataFromBundledDraft(draft);
  if (draft.chassis.type === "archetype") return buildActorDataFromArchetypeDraft(draft);
  return buildActorDataFromCompendiumDraft(draft);
}

/**
 * Create the Actor for a fully-reviewed draft.
 * @param {object} draft
 * @param {boolean} [renderSheet=true]
 * @returns {Promise<Actor>}
 */
export function createActorFromDraft(draft, renderSheet = true) {
  return Actor.create(draftToActorData(draft), { renderSheet });
}

/**
 * Convenience one-shot API for macros: roll a random-by-CR NPC and create it immediately,
 * skipping the review UI. See the module README for parameters.
 * @returns {Promise<Actor|null>}
 */
export async function generateNPC(params = {}) {
  const draft = await rollDraftRandom(params);
  if (!draft) {
    ui.notifications.warn(game.i18n.localize("NPC-GENERATOR-5E.Warnings.NoMatch"));
    return null;
  }
  return createActorFromDraft(draft, params.renderSheet ?? true);
}

/**
 * Convenience one-shot API for macros: roll an NPC from a specific compendium template
 * and create it immediately, skipping the review UI. See the module README for parameters.
 * @returns {Promise<Actor|null>}
 */
export async function generateNPCFromTemplate(params = {}) {
  const draft = await rollDraftFromTemplate(params);
  if (!draft) {
    ui.notifications.warn(game.i18n.localize("NPC-GENERATOR-5E.Warnings.TemplateNotFound"));
    return null;
  }
  return createActorFromDraft(draft, params.renderSheet ?? true);
}

/**
 * Convenience one-shot API for macros: roll a Quick Template (archetype + CR) NPC and
 * create it immediately, skipping the review UI. See the module README for parameters.
 * @returns {Promise<Actor|null>}
 */
export async function generateNPCFromArchetype(params = {}) {
  const draft = await rollDraftFromArchetype(params);
  return createActorFromDraft(draft, params.renderSheet ?? true);
}
