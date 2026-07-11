import { MODULE_ID, SETTINGS } from "./constants.js";

let _bundledCache = null;

/**
 * Load and cache the bundled SRD 5.1 NPC stat blocks shipped with the module.
 * @returns {Promise<object[]>}
 */
export async function loadBundledStatblocks() {
  if (_bundledCache) return _bundledCache;
  const path = `modules/${MODULE_ID}/scripts/data/srd-npc-statblocks.json`;
  const response = await fetch(path);
  if (!response.ok) {
    console.error(`${MODULE_ID} | Failed to load bundled statblocks from ${path}`);
    _bundledCache = [];
    return _bundledCache;
  }
  const data = await response.json();
  _bundledCache = (data.statblocks ?? []).map(sb => ({ ...sb, source: "bundled" }));
  return _bundledCache;
}

/**
 * Read CR off an Actor document, tolerant of both numeric and fractional-string forms.
 * @param {Actor} actor
 * @returns {number|null}
 */
function readActorCR(actor) {
  const raw = actor?.system?.details?.cr;
  if (raw === undefined || raw === null || raw === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

/**
 * Pull candidate template Actors out of a configured world/module compendium, if set.
 * @returns {Promise<object[]>} entries shaped like { source: "compendium", cr, actor }
 */
export async function loadCompendiumStatblocks() {
  const packId = game.settings.get(MODULE_ID, SETTINGS.CUSTOM_STATBLOCK_PACK)?.trim();
  if (!packId) return [];

  const pack = game.packs.get(packId);
  if (!pack) {
    ui.notifications.warn(game.i18n.format("NPC-GENERATOR-5E.Warnings.PackNotFound", { packId }));
    return [];
  }

  const documents = await pack.getDocuments({ type: "npc" });
  return documents
    .map(actor => ({ source: "compendium", cr: readActorCR(actor), actor }))
    .filter(entry => entry.cr !== null);
}

/**
 * Build the full candidate pool (bundled SRD blocks + optional compendium overrides).
 * @returns {Promise<object[]>}
 */
export async function buildStatblockPool() {
  const includeBundled = game.settings.get(MODULE_ID, SETTINGS.INCLUDE_BUNDLED_SRD);
  const pool = [];

  if (includeBundled) {
    const bundled = await loadBundledStatblocks();
    pool.push(...bundled.map(sb => ({ source: "bundled", cr: sb.cr, statblock: sb })));
  }

  pool.push(...(await loadCompendiumStatblocks()));

  return pool;
}

/**
 * Filter a statblock pool by challenge rating.
 * @param {object[]} pool
 * @param {object} opts
 * @param {number|null} [opts.exact] exact CR match
 * @param {number|null} [opts.min] minimum CR (inclusive)
 * @param {number|null} [opts.max] maximum CR (inclusive)
 * @returns {object[]}
 */
export function filterPoolByCR(pool, { exact = null, min = null, max = null } = {}) {
  return pool.filter(entry => {
    if (exact !== null) return entry.cr === exact;
    if (min !== null && entry.cr < min) return false;
    if (max !== null && entry.cr > max) return false;
    return true;
  });
}

/** All distinct CR values present in the bundled SRD set, sorted ascending. */
export async function getAvailableBundledCRs() {
  const bundled = await loadBundledStatblocks();
  const unique = [...new Set(bundled.map(sb => sb.cr))];
  return unique.sort((a, b) => a - b);
}
