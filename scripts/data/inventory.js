/**
 * Mundane, theme-flavored inventory items plus a shared "trinket" table for the rare
 * improv hook — an NPC who looks poor but is carrying something curious. Original
 * content — not sourced from any published book — safe to bundle and redistribute.
 */
export const THEME_ITEMS = {
  tavern: ["a stained apron", "a half-used tallow candle", "a dented tankard", "a bar rag", "a small bag of dice"],
  farm: ["a handful of seed grain", "a worn pair of work gloves", "a coil of twine", "a whetstone", "a battered straw hat"],
  military: ["a spare bowstring", "a polishing cloth", "a set of iron rations", "a folded muster roll", "a whistle on a cord"],
  criminal: ["a set of thieves' tools", "a hooded lantern", "a false-bottomed pouch", "a scrap of coded parchment", "a small crowbar"],
  noble: ["a wax seal stamp", "a folded letter of introduction", "a silk handkerchief", "a small snuff box", "a pair of fine gloves"],
  dock: ["a coil of tarred rope", "a fish hook and line", "a waterproof oilcloth wrap", "a tide chart", "a small marlinspike"],
  religious: ["a string of prayer beads", "a stub of holy candle", "a small vial of oil", "a well-worn prayer book", "a pouch of incense"],
  scholar: ["a bottle of ink and a quill", "a scrap of half-finished notes", "a magnifying lens", "a folded map fragment", "a wax tablet"],
  artisan: ["a set of small tools", "a swatch of spare material", "a measuring cord", "a bit of chalk for marking", "a scrap of the trade's raw material"],
  wilderness: ["a coil of snare wire", "a pouch of dried herbs", "a fire-starting kit", "a small game knife", "a waterskin"],
  street: ["a deck of worn cards", "a battered tin cup for coins", "a set of juggling balls", "a folded handbill", "a lucky charm on a string"]
};

const GENERIC_ITEMS = [
  "a belt pouch", "a waterskin", "a bit of stale bread", "a small knife", "a bundle of rags",
  "a stub of chalk", "a few feet of string", "a wooden comb", "a tinderbox", "a spare button or two"
];

const TRINKETS = [
  "a jeweled ring, too fine for its owner's station",
  "a tiny carved statuette of a minor god",
  "a locket with a portrait of someone unrecognizable",
  "a foreign coin from a distant, unfamiliar mint",
  "a folded love letter, never sent",
  "a small key that doesn't seem to fit anything nearby",
  "a vial of shimmering liquid, purpose unknown",
  "a signet ring bearing an unfamiliar crest",
  "a pressed flower from a place that doesn't grow it",
  "a scrap of parchment with a single cryptic sentence",
  "a polished gemstone, uncut and unset",
  "a child's drawing, folded and re-folded many times"
];

const TRINKET_CHANCE = 0.2;

function pickFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickSeveral(list, count) {
  const pool = [...list];
  const picked = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export function rollCoin() {
  const gp = Math.floor(Math.random() * 6);
  const sp = Math.floor(Math.random() * 12);
  if (gp === 0 && sp === 0) return "a couple of copper pieces";
  const parts = [];
  if (gp > 0) parts.push(`${gp} gp`);
  if (sp > 0) parts.push(`${sp} sp`);
  return parts.join(", ");
}

/**
 * Roll a small, flavorful inventory list for an NPC: a couple of theme items, a
 * generic odds-and-ends item, some pocket coin, and an occasional notable trinket.
 * @param {string} [themeId]
 * @returns {string[]}
 */
export function generateInventory(themeId) {
  const items = [];

  const themePool = THEME_ITEMS[themeId] ?? [];
  items.push(...pickSeveral(themePool, Math.min(2, themePool.length)));
  items.push(pickFrom(GENERIC_ITEMS));
  items.push(rollCoin());

  if (Math.random() < TRINKET_CHANCE) items.push(pickFrom(TRINKETS));

  return items;
}
