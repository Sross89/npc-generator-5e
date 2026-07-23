/**
 * Simple CR -> defense/offense profile table for the Quick Template generator.
 * Deliberately not a full monster-building engine — just enough for an AC/HP/attack
 * bonus/save DC that feels roughly right for the CR, hand-authored (not copied from
 * any published table).
 */
export const CR_PROFILES = [
  { cr: 0, hp: 4, ac: 10, attackBonus: 2, damageBonus: 0, saveDC: 10 },
  { cr: 0.125, hp: 7, ac: 11, attackBonus: 3, damageBonus: 1, saveDC: 11 },
  { cr: 0.25, hp: 12, ac: 12, attackBonus: 3, damageBonus: 1, saveDC: 11 },
  { cr: 0.5, hp: 20, ac: 12, attackBonus: 3, damageBonus: 2, saveDC: 12 },
  { cr: 1, hp: 30, ac: 13, attackBonus: 4, damageBonus: 2, saveDC: 12 },
  { cr: 2, hp: 42, ac: 13, attackBonus: 4, damageBonus: 3, saveDC: 13 },
  { cr: 3, hp: 58, ac: 14, attackBonus: 5, damageBonus: 3, saveDC: 13 },
  { cr: 4, hp: 75, ac: 14, attackBonus: 5, damageBonus: 4, saveDC: 14 },
  { cr: 5, hp: 95, ac: 15, attackBonus: 6, damageBonus: 4, saveDC: 15 },
  { cr: 6, hp: 115, ac: 15, attackBonus: 6, damageBonus: 5, saveDC: 15 },
  { cr: 7, hp: 135, ac: 15, attackBonus: 7, damageBonus: 5, saveDC: 15 },
  { cr: 8, hp: 160, ac: 16, attackBonus: 7, damageBonus: 6, saveDC: 16 }
];

export function crLabel(cr) {
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

export function getCRProfileOptions() {
  return CR_PROFILES.map(p => ({ value: p.cr, label: crLabel(p.cr) }));
}

export function getCRProfile(cr) {
  const numeric = Number(cr);
  return CR_PROFILES.find(p => p.cr === numeric) ?? CR_PROFILES[0];
}
