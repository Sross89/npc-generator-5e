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
