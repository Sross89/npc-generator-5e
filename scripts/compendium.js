/**
 * Helpers for browsing whatever Actor compendiums the current user has access to
 * (world compendiums, module compendiums, and any premium content the user owns)
 * so they can pick an exact template actor rather than rolling one randomly by CR.
 */

/** All compendiums that hold Actor documents, visible to the current user. */
export function getActorCompendiums() {
  return game.packs
    .filter(pack => pack.documentName === "Actor" && (game.user.isGM || pack.visible))
    .map(pack => ({ id: pack.metadata.id, label: `${pack.title} (${pack.metadata.packageName})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Lightweight index of the actors in a compendium, including the fields needed
 * to preview/prefill override stats without fetching every full document.
 * @param {string} packId
 * @returns {Promise<object[]>}
 */
export async function getPackActorIndex(packId) {
  const pack = game.packs.get(packId);
  if (!pack) return [];

  const index = await pack.getIndex({
    fields: [
      "img", "system.details.cr", "system.abilities",
      "system.attributes.ac", "system.attributes.hp"
    ]
  });

  return index.contents
    .map(entry => ({
      id: entry._id,
      name: entry.name,
      img: entry.img,
      cr: entry.system?.details?.cr ?? null,
      abilities: entry.system?.abilities ?? null,
      ac: entry.system?.attributes?.ac?.flat ?? entry.system?.attributes?.ac?.value ?? null,
      hp: entry.system?.attributes?.hp?.max ?? entry.system?.attributes?.hp?.value ?? null
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch the full Actor document for a chosen template (needed for items/traits/senses at generate-time).
 * @param {string} packId
 * @param {string} actorId
 * @returns {Promise<Actor|null>}
 */
export async function getPackActor(packId, actorId) {
  const pack = game.packs.get(packId);
  if (!pack) return null;
  return pack.getDocument(actorId);
}

/** All compendiums that hold Item documents, visible to the current user (for linking Species/Item/Spell content). */
export function getItemCompendiums() {
  return game.packs
    .filter(pack => pack.documentName === "Item" && (game.user.isGM || pack.visible))
    .map(pack => ({ id: pack.metadata.id, label: `${pack.title} (${pack.metadata.packageName})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const SPECIES_ITEM_TYPES = ["race", "species"];
const EQUIPMENT_ITEM_TYPES = ["weapon", "equipment", "consumable", "tool", "loot", "container"];
const SPELL_ITEM_TYPES = ["spell"];

/**
 * Lightweight index of the items in an Item compendium, optionally filtered by type.
 * @param {string} packId
 * @param {string[]|null} [types] restrict to these Item types; null for everything
 * @returns {Promise<object[]>} entries shaped like { packId, itemId, name, img, type, level }
 */
export async function getPackItemIndex(packId, types = null) {
  const pack = game.packs.get(packId);
  if (!pack) return [];

  const index = await pack.getIndex({ fields: ["img", "type", "system.level"] });

  return index.contents
    .filter(entry => !types || types.includes(entry.type))
    .map(entry => ({
      packId, itemId: entry._id, name: entry.name, img: entry.img,
      type: entry.type, level: entry.system?.level ?? null
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Lightweight index of the Species/Race items in an Item compendium. */
export function getPackSpeciesIndex(packId) {
  return getPackItemIndex(packId, SPECIES_ITEM_TYPES);
}

/** Lightweight index of the mundane equipment items (weapon/equipment/consumable/tool/loot/container) in an Item compendium. */
export function getPackEquipmentIndex(packId) {
  return getPackItemIndex(packId, EQUIPMENT_ITEM_TYPES);
}

/** Lightweight index of the spell items in an Item compendium. */
export function getPackSpellIndex(packId) {
  return getPackItemIndex(packId, SPELL_ITEM_TYPES);
}

/**
 * Fetch the full Item document for a chosen entry (needed for its full mechanical
 * data — ability score increases, traits, spell effects, etc. — applied via dnd5e's
 * own systems on the actor sheet).
 * @param {string} packId
 * @param {string} itemId
 * @returns {Promise<Item|null>}
 */
export async function getPackItem(packId, itemId) {
  const pack = game.packs.get(packId);
  if (!pack) return null;
  return pack.getDocument(itemId);
}
