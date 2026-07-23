/**
 * Small spell-name pools for the Quick Template caster archetypes, split by casting
 * flavor and a rough tier. This is flavor text only (spell names written into a
 * "Spellcasting" trait, same as the bundled SRD statblocks already do) — not a real
 * slots/prepared-spells implementation. Spell names are SRD open-content game terms.
 */
export const SPELL_LISTS = {
  arcane: {
    cantrips: ["Fire Bolt", "Mage Hand", "Prestidigitation", "Light", "Minor Illusion", "Ray of Frost"],
    low: ["Magic Missile", "Shield", "Detect Magic", "Mage Armor", "Sleep", "Burning Hands"],
    mid: ["Misty Step", "Scorching Ray", "Counterspell", "Fireball", "Fly", "Lightning Bolt"]
  },
  divine: {
    cantrips: ["Sacred Flame", "Guidance", "Thaumaturgy", "Light", "Spare the Dying"],
    low: ["Cure Wounds", "Bless", "Guiding Bolt", "Shield of Faith", "Sanctuary"],
    mid: ["Spiritual Weapon", "Prayer of Healing", "Dispel Magic", "Revivify", "Beacon of Hope"]
  }
};

function pickSeveral(list, count) {
  const pool = [...list];
  const picked = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

/**
 * Roll a small spell package appropriate to a caster flavor and CR.
 * @param {{flavor: "arcane"|"divine", ability: string}} casterInfo
 * @param {number} cr
 * @returns {{cantrips: string[], spells: string[]}}
 */
export function generateSpellPackage(casterInfo, cr) {
  const list = SPELL_LISTS[casterInfo.flavor];
  const cantrips = pickSeveral(list.cantrips, 3);
  const spells = [];
  if (cr >= 1) spells.push(...pickSeveral(list.low, 2));
  if (cr >= 5) spells.push(...pickSeveral(list.mid, 2));
  return { cantrips, spells };
}
