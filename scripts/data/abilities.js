import { ABILITY_KEYS } from "../constants.js";

function roll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

/** Classic 4d6-drop-lowest, for a single ability score. */
function rollScore() {
  const dice = [roll(6), roll(6), roll(6), roll(6)].sort((a, b) => a - b);
  return dice[1] + dice[2] + dice[3];
}

/**
 * Roll a fresh, independent set of ability scores.
 * @returns {{str: number, dex: number, con: number, int: number, wis: number, cha: number}}
 */
export function rollAbilities() {
  const abilities = {};
  for (const key of ABILITY_KEYS) abilities[key] = rollScore();
  return abilities;
}

/**
 * Roll six 4d6-drop-lowest scores and assign them highest-to-lowest down a priority
 * order, so an archetype's marquee ability (e.g. a Mage's INT) reliably comes out on top.
 * @param {string[]} priorityOrder six ability keys, most important first
 * @returns {{str: number, dex: number, con: number, int: number, wis: number, cha: number}}
 */
export function rollPrioritizedAbilities(priorityOrder) {
  const rolls = priorityOrder.map(() => rollScore()).sort((a, b) => b - a);
  const abilities = {};
  priorityOrder.forEach((key, index) => (abilities[key] = rolls[index]));
  return abilities;
}
