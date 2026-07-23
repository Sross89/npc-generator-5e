import { ABILITY_KEYS, MODULE_ID, SETTINGS } from "./constants.js";
import { generateName } from "./data/names.js";
import { generateFlavor } from "./data/flavor.js";
import { generateOccupation } from "./data/occupations.js";
import { generateInventory } from "./data/inventory.js";
import { rollAbilities, rollPrioritizedAbilities } from "./data/abilities.js";
import { ARCHETYPES, ARMOR_AC_MODIFIER } from "./data/archetypes.js";
import { getCRProfile } from "./data/cr-profiles.js";
import { generateSpellPackage } from "./data/spells.js";
import { buildStatblockPool, filterPoolByCR } from "./statblocks.js";
import { getPackActor, getPackItem } from "./compendium.js";

/**
 * An in-memory, fully-editable "draft" NPC: everything rolled here can be hand-edited
 * or individually re-rolled in the review UI before anything is written to an Actor.
 */

const GENDERS = ["male", "female", "neutral"];

function pickGender() {
  return GENDERS[Math.floor(Math.random() * GENDERS.length)];
}

function parseSpeed(speedText) {
  return Number((speedText || "30").match(/\d+/)?.[0]) || 30;
}

/**
 * Resolve a name either from a configured world RollTable override or the bundled generic tables.
 * @param {string} [culture]
 * @param {string} [gender]
 * @returns {Promise<string>}
 */
async function resolveName(culture, gender) {
  const tableUuid = game.settings.get(MODULE_ID, SETTINGS.NAME_TABLE_UUID)?.trim();
  if (tableUuid) {
    try {
      const table = await fromUuid(tableUuid);
      if (table) {
        const draw = await table.draw({ displayChat: false });
        const text = draw?.results?.[0]?.text ?? draw?.results?.[0]?.name;
        if (text) return text;
      }
    } catch (err) {
      console.warn(`${MODULE_ID} | Failed to draw from configured name table, falling back to bundled names.`, err);
    }
  }
  return generateName({ culture, gender }).name;
}

function chassisFromStatblock(statblock) {
  return {
    type: "bundled",
    statblock,
    abilities: { ...statblock.abilities },
    ac: statblock.ac,
    hp: statblock.hp.average,
    speed: parseSpeed(statblock.speed),
    senses: statblock.senses ?? ""
  };
}

function chassisFromActor(actor) {
  const abilities = {};
  for (const key of ABILITY_KEYS) abilities[key] = actor.system?.abilities?.[key]?.value ?? 10;
  return {
    type: "compendium",
    sourceActor: actor,
    abilities,
    ac: actor.system?.attributes?.ac?.flat ?? actor.system?.attributes?.ac?.value ?? 10,
    hp: actor.system?.attributes?.hp?.max ?? actor.system?.attributes?.hp?.value ?? 10,
    speed: actor.system?.attributes?.movement?.walk ?? 30,
    senses: actor.system?.attributes?.senses?.special ?? ""
  };
}

function chassisFromArchetype(archetypeId, cr) {
  const archetype = ARCHETYPES[archetypeId];
  const profile = getCRProfile(cr);
  const abilities = rollPrioritizedAbilities(archetype.priority);
  const passivePerception = 10 + Math.floor(((abilities.wis ?? 10) - 10) / 2);

  return {
    type: "archetype",
    archetypeId,
    cr: Number(cr),
    label: archetype.label,
    abilities,
    ac: profile.ac + (ARMOR_AC_MODIFIER[archetype.armor] ?? 0),
    hp: profile.hp,
    speed: 30,
    senses: `passive Perception ${passivePerception}`,
    attacks: archetype.attacks,
    attackBonus: profile.attackBonus,
    damageBonus: profile.damageBonus,
    saveDC: profile.saveDC,
    spellPackage: archetype.caster ? generateSpellPackage(archetype.caster, Number(cr)) : null
  };
}

async function buildDraft(chassis, {
  culture = null, gender = null, theme = null, pool = null,
  includeItems = true, keepArtwork = true, initialName = null
} = {}) {
  const resolvedGender = gender ?? pickGender();
  const name = initialName ?? await resolveName(culture, resolvedGender);

  return {
    chassis,
    pool,
    culture,
    theme,
    name,
    gender: resolvedGender,
    occupation: generateOccupation(theme),
    abilities: { ...chassis.abilities },
    stats: { ac: chassis.ac, hp: chassis.hp, speed: chassis.speed, senses: chassis.senses },
    personality: generateFlavor(),
    inventory: generateInventory(theme),
    includeItems,
    keepArtwork,
    species: null,
    speciesPool: []
  };
}

/**
 * Roll a fresh draft at random from the bundled/custom statblock pool, filtered by CR.
 * @returns {Promise<object|null>}
 */
export async function rollDraftRandom({ exactCR = null, minCR = null, maxCR = null, culture = null, theme = null, gender = null } = {}) {
  const pool = await buildStatblockPool();
  const matches = filterPoolByCR(pool, { exact: exactCR, min: minCR, max: maxCR });
  if (!matches.length) return null;

  const chosen = matches[Math.floor(Math.random() * matches.length)];
  const chassis = chosen.source === "bundled" ? chassisFromStatblock(chosen.statblock) : chassisFromActor(chosen.actor);
  return buildDraft(chassis, { culture, gender, theme, pool: matches });
}

/**
 * Roll a draft cloned from one specifically-chosen compendium template Actor.
 * The template's own name is kept as the starting point (reroll to replace it).
 * @returns {Promise<object|null>}
 */
export async function rollDraftFromTemplate({
  packId, actorId, culture = null, theme = null, gender = null, includeItems = true, keepArtwork = true
} = {}) {
  const actor = await getPackActor(packId, actorId);
  if (!actor) return null;

  const chassis = chassisFromActor(actor);
  return buildDraft(chassis, { culture, gender, theme, pool: null, includeItems, keepArtwork, initialName: actor.name });
}

/**
 * Roll a draft from a Quick Template archetype (Bandit, Commoner, Mage, ...) at a chosen CR.
 * @returns {Promise<object>}
 */
export async function rollDraftFromArchetype({ archetypeId, cr, culture = null, theme = null, gender = null } = {}) {
  const chassis = chassisFromArchetype(archetypeId, cr);
  return buildDraft(chassis, { culture, gender, theme, pool: null });
}

export async function rerollName(draft) {
  draft.name = await resolveName(draft.culture, draft.gender);
}

export function rerollGender(draft) {
  draft.gender = pickGender();
}

export function rerollOccupation(draft) {
  draft.occupation = generateOccupation(draft.theme);
}

export function rerollAbilities(draft) {
  if (draft.chassis.type === "archetype") {
    draft.abilities = rollPrioritizedAbilities(ARCHETYPES[draft.chassis.archetypeId].priority);
    return;
  }
  draft.abilities = rollAbilities();
}

/**
 * Reroll the NPC's base chassis: a new pick from the roll pool (Random by CR), or a
 * freshly-generated instance of the same archetype+CR (Quick Template). No-op (returns
 * false) for a specifically-chosen compendium actor, since that pick was deliberate.
 */
export function rerollStatSheet(draft) {
  if (draft.chassis.type === "archetype") {
    const chassis = chassisFromArchetype(draft.chassis.archetypeId, draft.chassis.cr);
    draft.chassis = chassis;
    draft.abilities = { ...chassis.abilities };
    draft.stats = { ac: chassis.ac, hp: chassis.hp, speed: chassis.speed, senses: chassis.senses };
    return true;
  }

  if (!draft.pool?.length) return false;
  const chosen = draft.pool[Math.floor(Math.random() * draft.pool.length)];
  const chassis = chosen.source === "bundled" ? chassisFromStatblock(chosen.statblock) : chassisFromActor(chosen.actor);
  draft.chassis = chassis;
  draft.abilities = { ...chassis.abilities };
  draft.stats = { ac: chassis.ac, hp: chassis.hp, speed: chassis.speed, senses: chassis.senses };
  return true;
}

export function rerollPersonality(draft) {
  draft.personality = generateFlavor();
}

export function rerollInventory(draft) {
  draft.inventory = generateInventory(draft.theme);
}

/** Reroll every field on an existing draft, keeping its original source pool/template and current culture/theme. */
export async function rerollAllDraftFields(draft) {
  rerollGender(draft);
  await rerollName(draft);
  rerollOccupation(draft);
  rerollAbilities(draft);
  rerollStatSheet(draft);
  rerollPersonality(draft);
  rerollInventory(draft);
  await rerollSpecies(draft);
}

// ---------------------------------------------------------------------
// Species linking: an optional Species/Race Item, drawn from whichever Item
// compendium(s) the GM has checked, embedded onto the actor at creation time.
// Ability score increases and choice-based traits still go through dnd5e's own
// Advancement UI on the sheet afterward — this module only picks and embeds
// the item itself.
// ---------------------------------------------------------------------

async function loadSpecies(entry) {
  if (!entry) return null;
  const item = await getPackItem(entry.packId, entry.itemId);
  return item ? { name: item.name, img: item.img, sourceItem: item } : null;
}

function pickRandomSpeciesEntry(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Resolve and attach the draft's species, given the pool of species assembled from
 * whichever compendiums are checked in setup.
 * @param {object} draft
 * @param {object[]} speciesPool entries shaped like { packId, itemId, name, img }
 * @param {"random"|"none"|{packId,itemId}|null} [selection] "random" (default) or "none", or a specific entry
 */
export async function applySpecies(draft, speciesPool, selection = "random") {
  draft.speciesPool = speciesPool;
  if (!speciesPool.length || selection === "none") {
    draft.species = null;
    return;
  }

  const entry = selection && selection !== "random"
    ? speciesPool.find(e => e.packId === selection.packId && e.itemId === selection.itemId)
    : null;

  draft.species = await loadSpecies(entry ?? pickRandomSpeciesEntry(speciesPool));
}

/** Pick a new random species from the draft's own species pool. No-op if no compendiums were linked. */
export async function rerollSpecies(draft) {
  if (!draft.speciesPool?.length) {
    draft.species = null;
    return;
  }
  draft.species = await loadSpecies(pickRandomSpeciesEntry(draft.speciesPool));
}

/**
 * Directly set the draft's species from its own pool (or clear it).
 * @param {object} draft
 * @param {{packId: string, itemId: string}|null} selection
 */
export async function setSpecies(draft, selection) {
  if (!selection) {
    draft.species = null;
    return;
  }
  const entry = draft.speciesPool?.find(e => e.packId === selection.packId && e.itemId === selection.itemId) ?? selection;
  draft.species = await loadSpecies(entry);
}
