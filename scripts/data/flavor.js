/**
 * Generic, original flavor tables (occupations, personality, ideals, bonds, flaws, quirks).
 * Written from scratch — not sourced from any published book — safe to bundle and redistribute.
 */
export const FLAVOR_TABLES = {
  occupations: [
    "Innkeeper", "Blacksmith", "Farmer", "Merchant", "Guard captain", "Fisher", "Herbalist", "Stablehand",
    "Cartographer", "Fortune teller", "Tavern bard", "Dockworker", "Scribe", "Hunter", "Tailor", "Miller",
    "Beggar", "Courier", "Mercenary", "Alchemist's apprentice", "Grave digger", "Bell ringer", "Rat catcher",
    "Toll collector", "Shepherd", "Woodcutter", "Brewer", "Locksmith", "Street performer", "Retired soldier"
  ],
  personalityTraits: [
    "Speaks in a low mutter, as if sharing a secret even when they aren't.",
    "Constantly fidgets with a small trinket or coin.",
    "Laughs at inappropriate moments.",
    "Never sits with their back to a door.",
    "Overly polite, even to people who clearly don't deserve it.",
    "Quick to anger, quicker to apologize.",
    "Collects odd little souvenirs from every place they visit.",
    "Distrusts anyone who seems too friendly.",
    "Hums old work-songs while thinking.",
    "Answers questions with another question.",
    "Keeps meticulous, obsessive records of small debts owed.",
    "Superstitious about numbers, colors, or directions.",
    "Blunt to the point of rudeness, but never dishonest.",
    "Speaks fondly of a hometown they will never return to.",
    "Always finishes other people's sentences."
  ],
  ideals: [
    "Community. We look after our own, and outsiders earn trust slowly.",
    "Fairness. Everyone pays the same price, no exceptions.",
    "Ambition. There is always a next rung on the ladder.",
    "Freedom. No one tells me what to do with my own hands.",
    "Tradition. The old ways held communities together for a reason.",
    "Survival. Rules matter less than making it to tomorrow.",
    "Loyalty. I owe everything to the people who took me in.",
    "Curiosity. Every stranger has a story worth hearing.",
    "Faith. Something larger than me is watching, and it matters how I act.",
    "Coin. Everything and everyone has a price."
  ],
  bonds: [
    "They are saving for a family member's debt.",
    "They owe their life to someone in town and won't say who.",
    "A childhood friend went missing years ago and they still watch for them.",
    "They send half of everything they earn to a sibling in another town.",
    "They're rebuilding something that burned down.",
    "A mentor taught them their trade and they guard that memory fiercely.",
    "They keep a promise made to someone now dead.",
    "Their whole livelihood depends on a single patron's goodwill.",
    "They're paying off passage on a ship that never came back for them.",
    "They quietly support an orphaned relative."
  ],
  flaws: [
    "Can't resist a wager, even bad ones.",
    "Drinks more than they should when stressed.",
    "Holds a grudge long after everyone else has forgotten the slight.",
    "Talks too much when nervous, giving away more than intended.",
    "Secretly in debt to someone unpleasant.",
    "Refuses to admit when they're wrong.",
    "Easily flattered into bad decisions.",
    "Has a temper that flares faster than it should.",
    "Superstitious to the point of bad judgment.",
    "Will lie to avoid an awkward conversation, even when honesty would cost nothing."
  ],
  quirks: [
    "Always smells faintly of the trade they practice.",
    "Wears a piece of jewelry that clearly doesn't match their station.",
    "Has a pet that follows them nearly everywhere.",
    "Missing a finger and has an increasingly implausible story for each retelling.",
    "Speaks with a distinctive accent from somewhere far away.",
    "Never removes a particular hat, hood, or scarf.",
    "Has a nervous tell that gives away when they're lying.",
    "Carries a weapon that's clearly ceremonial, not practical.",
    "Addresses everyone by an invented nickname within minutes of meeting them.",
    "Keeps a battered journal they write in constantly."
  ]
};

function pickFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Roll a small flavor package for an NPC (occupation, trait, ideal, bond, flaw, quirk).
 * @returns {{occupation: string, personalityTrait: string, ideal: string, bond: string, flaw: string, quirk: string}}
 */
export function generateFlavor() {
  return {
    occupation: pickFrom(FLAVOR_TABLES.occupations),
    personalityTrait: pickFrom(FLAVOR_TABLES.personalityTraits),
    ideal: pickFrom(FLAVOR_TABLES.ideals),
    bond: pickFrom(FLAVOR_TABLES.bonds),
    flaw: pickFrom(FLAVOR_TABLES.flaws),
    quirk: pickFrom(FLAVOR_TABLES.quirks)
  };
}
