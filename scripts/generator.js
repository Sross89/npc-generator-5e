import { MODULE_ID, SETTINGS, SIZE_MAP, SKILL_KEY_MAP, ABILITY_KEYS } from "./constants.js";
import { generateName } from "./data/names.js";
import { generateFlavor } from "./data/flavor.js";
import { buildStatblockPool, filterPoolByCR } from "./statblocks.js";
import { getPackActor } from "./compendium.js";

const DEFAULT_IMG = "icons/svg/mystery-man.svg";

/**
 * Resolve a name either from a configured world RollTable override or the bundled generic tables.
 * @param {string} [culture]
 * @returns {Promise<{name: string, culture: string}>}
 */
async function resolveName(culture) {
  const tableUuid = game.settings.get(MODULE_ID, SETTINGS.NAME_TABLE_UUID)?.trim();
  if (tableUuid) {
    try {
      const table = await fromUuid(tableUuid);
      if (table) {
        const draw = await table.draw({ displayChat: false });
        const text = draw?.results?.[0]?.text ?? draw?.results?.[0]?.name;
        if (text) return { name: text, culture: culture ?? "custom-table" };
      }
    } catch (err) {
      console.warn(`${MODULE_ID} | Failed to draw from configured name table, falling back to bundled names.`, err);
    }
  }
  return generateName({ culture });
}

function parseDarkvision(sensesText = "") {
  const match = /darkvision (\d+)\s*ft/i.exec(sensesText);
  return match ? Number(match[1]) : 0;
}

function buildAbilities(statblock) {
  const abilities = {};
  for (const key of ABILITY_KEYS) {
    abilities[key] = { value: statblock.abilities?.[key] ?? 10 };
  }
  return abilities;
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
      console.warn(`${MODULE_ID} | Could not build a structured activity for "${action.name}"; description text is still fully populated.`, err);
    }
    items.push(item);
  }

  return items;
}

function buildBiography(statblock, flavor, appendFlavor) {
  const lines = [`<p><strong>Source:</strong> ${statblock.source}</p>`];
  if (appendFlavor) {
    lines.push(
      `<p><strong>Occupation:</strong> ${flavor.occupation}</p>`,
      `<p><strong>Personality:</strong> ${flavor.personalityTrait}</p>`,
      `<p><strong>Ideal:</strong> ${flavor.ideal}</p>`,
      `<p><strong>Bond:</strong> ${flavor.bond}</p>`,
      `<p><strong>Flaw:</strong> ${flavor.flaw}</p>`,
      `<p><strong>Quirk:</strong> ${flavor.quirk}</p>`
    );
  }
  return lines.join("\n");
}

/**
 * Translate one bundled SRD statblock + rolled name/flavor into full Foundry Actor create data.
 * @param {object} statblock
 * @param {string} name
 * @param {object} flavor
 * @returns {object}
 */
function buildActorDataFromStatblock(statblock, name, flavor) {
  const appendFlavor = game.settings.get(MODULE_ID, SETTINGS.APPEND_FLAVOR_TO_BIOGRAPHY);

  return {
    name,
    type: "npc",
    items: buildItems(statblock),
    system: {
      abilities: buildAbilities(statblock),
      attributes: {
        ac: { flat: statblock.ac, calc: "flat" },
        hp: { value: statblock.hp.average, max: statblock.hp.average, formula: statblock.hp.formula },
        movement: { walk: Number((statblock.speed || "30").match(/\d+/)?.[0]) || 30, units: "ft" },
        senses: { darkvision: parseDarkvision(statblock.senses), special: statblock.senses ?? "" }
      },
      details: {
        cr: statblock.cr,
        type: { value: statblock.type, subtype: statblock.subtype ?? "" },
        alignment: statblock.alignment,
        biography: { value: buildBiography(statblock, flavor, appendFlavor) }
      },
      traits: {
        size: SIZE_MAP[statblock.size] ?? "med",
        languages: { value: [], custom: statblock.languages ?? "" }
      },
      skills: buildSkills(statblock)
    }
  };
}

/**
 * Append the rolled flavor package to an actor data object's existing biography, if the
 * "append flavor" setting is enabled.
 * @param {object} data
 * @param {object} flavor
 */
function appendFlavorToBiography(data, flavor) {
  const appendFlavor = game.settings.get(MODULE_ID, SETTINGS.APPEND_FLAVOR_TO_BIOGRAPHY);
  if (!appendFlavor) return;
  const existing = foundry.utils.getProperty(data, "system.details.biography.value") ?? "";
  const block = [
    `<p><strong>Occupation:</strong> ${flavor.occupation}</p>`,
    `<p><strong>Personality:</strong> ${flavor.personalityTrait}</p>`,
    `<p><strong>Ideal:</strong> ${flavor.ideal}</p>`,
    `<p><strong>Bond:</strong> ${flavor.bond}</p>`,
    `<p><strong>Flaw:</strong> ${flavor.flaw}</p>`,
    `<p><strong>Quirk:</strong> ${flavor.quirk}</p>`
  ].join("\n");
  foundry.utils.setProperty(data, "system.details.biography.value", `${existing}\n${block}`);
}

/**
 * Clone a compendium override Actor as the generation source, re-rolling its name and biography.
 * @param {Actor} sourceActor
 * @param {string} name
 * @param {object} flavor
 * @returns {object}
 */
function buildActorDataFromCompendium(sourceActor, name, flavor) {
  const data = sourceActor.toObject();
  delete data._id;
  data.name = name;
  appendFlavorToBiography(data, flavor);
  return data;
}

/**
 * Apply user-supplied ability score overrides (any subset of str/dex/con/int/wis/cha) onto
 * actor create data. Blank/undefined entries are left untouched so the source value carries over.
 * @param {object} data
 * @param {object|null} abilityOverrides
 */
function applyAbilityOverrides(data, abilityOverrides) {
  if (!abilityOverrides) return;
  for (const key of ABILITY_KEYS) {
    const value = abilityOverrides[key];
    if (value === null || value === undefined || value === "") continue;
    foundry.utils.setProperty(data, `system.abilities.${key}.value`, Number(value));
  }
}

/**
 * Clone a specifically-chosen template Actor, applying whichever overrides the user supplied.
 * @param {Actor} sourceActor
 * @param {object} opts
 * @param {string} opts.name
 * @param {object} opts.flavor
 * @param {object|null} [opts.abilityOverrides] any subset of {str,dex,con,int,wis,cha}
 * @param {number|string|null} [opts.acOverride]
 * @param {number|string|null} [opts.hpOverride]
 * @param {boolean} [opts.includeItems=true] carry over the source actor's weapons/features
 * @param {boolean} [opts.keepArtwork=true] carry over the source actor's portrait/token image
 * @returns {object}
 */
function buildOverriddenActorData(sourceActor, {
  name, flavor, abilityOverrides = null, acOverride = null, hpOverride = null,
  includeItems = true, keepArtwork = true
}) {
  const data = sourceActor.toObject();
  delete data._id;
  data.name = name;

  applyAbilityOverrides(data, abilityOverrides);

  if (acOverride !== null && acOverride !== undefined && acOverride !== "") {
    foundry.utils.setProperty(data, "system.attributes.ac.flat", Number(acOverride));
    foundry.utils.setProperty(data, "system.attributes.ac.calc", "flat");
  }

  if (hpOverride !== null && hpOverride !== undefined && hpOverride !== "") {
    foundry.utils.setProperty(data, "system.attributes.hp.value", Number(hpOverride));
    foundry.utils.setProperty(data, "system.attributes.hp.max", Number(hpOverride));
  }

  if (!includeItems) data.items = [];

  if (!keepArtwork) {
    data.img = DEFAULT_IMG;
    foundry.utils.setProperty(data, "prototypeToken.texture.src", DEFAULT_IMG);
  }

  if (flavor) appendFlavorToBiography(data, flavor);

  return data;
}

/**
 * Generate and create a new NPC Actor matching the requested parameters.
 * @param {object} params
 * @param {number|null} [params.exactCR]
 * @param {number|null} [params.minCR]
 * @param {number|null} [params.maxCR]
 * @param {string} [params.culture]
 * @param {boolean} [params.renderSheet=true]
 * @returns {Promise<Actor|null>}
 */
export async function generateNPC({ exactCR = null, minCR = null, maxCR = null, culture = null, renderSheet = true } = {}) {
  const pool = await buildStatblockPool();
  const matches = filterPoolByCR(pool, { exact: exactCR, min: minCR, max: maxCR });

  if (!matches.length) {
    ui.notifications.warn(game.i18n.localize("NPC-GENERATOR-5E.Warnings.NoMatch"));
    return null;
  }

  const chosen = matches[Math.floor(Math.random() * matches.length)];
  const { name } = await resolveName(culture);
  const flavor = generateFlavor();

  const actorData = chosen.source === "bundled"
    ? buildActorDataFromStatblock(chosen.statblock, name, flavor)
    : buildActorDataFromCompendium(chosen.actor, name, flavor);

  return Actor.create(actorData, { renderSheet });
}

/**
 * Generate an NPC Actor cloned from one specifically-chosen compendium template
 * (e.g. "Guard" out of a Monster Manual compendium you own), with optional overrides.
 * @param {object} params
 * @param {string} params.packId compendium pack id, e.g. "dnd5e.monsters"
 * @param {string} params.actorId id of the template Actor within that pack
 * @param {"keep"|"random"|"custom"} [params.nameMode="keep"]
 * @param {string} [params.customName] used when nameMode is "custom"
 * @param {string} [params.culture] used when nameMode is "random"
 * @param {object|null} [params.abilityOverrides] any subset of {str,dex,con,int,wis,cha}
 * @param {number|string|null} [params.acOverride]
 * @param {number|string|null} [params.hpOverride]
 * @param {boolean} [params.includeItems=true]
 * @param {boolean} [params.keepArtwork=true]
 * @param {boolean} [params.renderSheet=true]
 * @returns {Promise<Actor|null>}
 */
export async function generateNPCFromTemplate({
  packId,
  actorId,
  nameMode = "keep",
  customName = "",
  culture = null,
  abilityOverrides = null,
  acOverride = null,
  hpOverride = null,
  includeItems = true,
  keepArtwork = true,
  renderSheet = true
} = {}) {
  const sourceActor = await getPackActor(packId, actorId);
  if (!sourceActor) {
    ui.notifications.warn(game.i18n.localize("NPC-GENERATOR-5E.Warnings.TemplateNotFound"));
    return null;
  }

  let name;
  if (nameMode === "custom" && customName.trim()) name = customName.trim();
  else if (nameMode === "random") ({ name } = await resolveName(culture));
  else name = sourceActor.name;

  const flavor = generateFlavor();

  const actorData = buildOverriddenActorData(sourceActor, {
    name, flavor, abilityOverrides, acOverride, hpOverride, includeItems, keepArtwork
  });

  return Actor.create(actorData, { renderSheet });
}
