/**
 * Quick Template archetypes: a role (Bandit, Commoner, Mage, ...) that determines
 * ability priority, armor flavor, a weapon or two, and whether it's a spellcaster.
 * The CR profile (see cr-profiles.js) supplies the actual numbers; the archetype
 * just shapes how those numbers get spent. Original content, not sourced from any
 * published statblock.
 */
export const ARCHETYPES = {
  commoner: {
    label: "Commoner",
    priority: ["con", "str", "wis", "dex", "cha", "int"],
    armor: "none",
    attacks: [{ name: "Club", type: "mwak", die: "1d4", damageType: "bludgeoning", reach: "5 ft." }],
    caster: null
  },
  bandit: {
    label: "Bandit / Thug",
    priority: ["dex", "str", "con", "wis", "cha", "int"],
    armor: "light",
    attacks: [
      { name: "Scimitar", type: "mwak", die: "1d6", damageType: "slashing", reach: "5 ft." },
      { name: "Light Crossbow", type: "rwak", die: "1d8", damageType: "piercing", range: "80/320 ft." }
    ],
    caster: null
  },
  guard: {
    label: "Guard / Soldier",
    priority: ["str", "con", "dex", "wis", "cha", "int"],
    armor: "medium",
    attacks: [{ name: "Spear", type: "mwak", die: "1d6", damageType: "piercing", reach: "5 ft." }],
    caster: null
  },
  veteran: {
    label: "Veteran / Knight",
    priority: ["str", "con", "dex", "wis", "cha", "int"],
    armor: "heavy",
    attacks: [{ name: "Longsword", type: "mwak", die: "1d8", damageType: "slashing", reach: "5 ft." }],
    caster: null
  },
  berserker: {
    label: "Berserker / Brute",
    priority: ["str", "con", "dex", "wis", "cha", "int"],
    armor: "none",
    attacks: [{ name: "Greataxe", type: "mwak", die: "1d12", damageType: "slashing", reach: "5 ft." }],
    caster: null
  },
  scout: {
    label: "Scout / Archer",
    priority: ["dex", "wis", "con", "str", "cha", "int"],
    armor: "light",
    attacks: [{ name: "Shortbow", type: "rwak", die: "1d6", damageType: "piercing", range: "80/320 ft." }],
    caster: null
  },
  spy: {
    label: "Spy / Rogue",
    priority: ["dex", "cha", "con", "wis", "str", "int"],
    armor: "light",
    attacks: [
      { name: "Shortsword", type: "mwak", die: "1d6", damageType: "piercing", reach: "5 ft." },
      { name: "Hand Crossbow", type: "rwak", die: "1d6", damageType: "piercing", range: "30/120 ft." }
    ],
    caster: null
  },
  cultist: {
    label: "Cultist / Acolyte",
    priority: ["wis", "cha", "con", "dex", "str", "int"],
    armor: "none",
    attacks: [{ name: "Sickle", type: "mwak", die: "1d4", damageType: "slashing", reach: "5 ft." }],
    caster: { flavor: "divine", ability: "wis" }
  },
  priest: {
    label: "Priest",
    priority: ["wis", "con", "cha", "str", "dex", "int"],
    armor: "medium",
    attacks: [{ name: "Mace", type: "mwak", die: "1d6", damageType: "bludgeoning", reach: "5 ft." }],
    caster: { flavor: "divine", ability: "wis" }
  },
  mage: {
    label: "Mage",
    priority: ["int", "dex", "con", "wis", "cha", "str"],
    armor: "none",
    attacks: [{ name: "Quarterstaff", type: "mwak", die: "1d6", damageType: "bludgeoning", reach: "5 ft." }],
    caster: { flavor: "arcane", ability: "int" }
  },
  noble: {
    label: "Noble / Courtier",
    priority: ["cha", "wis", "int", "con", "dex", "str"],
    armor: "none",
    attacks: [{ name: "Rapier", type: "mwak", die: "1d8", damageType: "piercing", reach: "5 ft." }],
    caster: null
  }
};

/** AC nudge applied on top of the CR profile's baseline AC, by armor flavor. */
export const ARMOR_AC_MODIFIER = { none: -1, light: 0, medium: 1, heavy: 3 };

export function getArchetypeOptions() {
  return Object.entries(ARCHETYPES).map(([id, a]) => ({ id, label: a.label }));
}
