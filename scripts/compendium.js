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

/** All compendiums that hold Item documents, visible to the current user (for linking a Species/Race compendium). */
export function getItemCompendiums() {
  return game.packs
    .filter(pack => pack.documentName === "Item" && (game.user.isGM || pack.visible))
    .map(pack => ({ id: pack.metadata.id, label: `${pack.title} (${pack.metadata.packageName})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const SPECIES_ITEM_TYPES = ["race", "species"];

/**
 * Lightweight index of the Species/Race items in an Item compendium.
 * @param {string} packId
 * @returns {Promise<object[]>}
 */
export async function getPackSpeciesIndex(packId) {
  const pack = game.packs.get(packId);
  if (!pack) return [];

  const index = await pack.getIndex({ fields: ["img", "type"] });

  return index.contents
    .filter(entry => SPECIES_ITEM_TYPES.includes(entry.type))
    .map(entry => ({ packId, itemId: entry._id, name: entry.name, img: entry.img }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch the full Item document for a chosen species (needed for its ability score
 * increases and traits, applied via dnd5e's own Advancement system on the actor sheet).
 * @param {string} packId
 * @param {string} itemId
 * @returns {Promise<Item|null>}
 */
export async function getPackItem(packId, itemId) {
  const pack = game.packs.get(packId);
  if (!pack) return null;
  return pack.getDocument(itemId);
}
