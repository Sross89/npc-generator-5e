/**
 * Occupation tables bucketed by theme, so a rolled occupation actually fits the NPC's
 * setting (a tavern worker doesn't roll "advisor to the king"). Original content — not
 * sourced from any published book — safe to bundle and redistribute.
 */
export const OCCUPATION_THEMES = {
  tavern: {
    label: "Tavern & Inn",
    occupations: [
      "Innkeeper", "Barkeep", "Tavern bard", "Cook", "Dishwasher", "Cellar hand",
      "Bouncer", "Server", "Stablehand", "Chimney sweep for the inn's hearths"
    ]
  },
  farm: {
    label: "Farm & Rural",
    occupations: [
      "Farmer", "Shepherd", "Miller", "Beekeeper", "Farmhand", "Orchard keeper",
      "Livestock breeder", "Thresher", "Wagon driver", "Well digger"
    ]
  },
  military: {
    label: "Military & Guard",
    occupations: [
      "Guard captain", "City watchman", "Retired soldier", "Mercenary", "Quartermaster",
      "Gate warden", "Drill sergeant", "Scout", "Armorer's assistant", "War veteran turned recruiter"
    ]
  },
  criminal: {
    label: "Criminal & Underworld",
    occupations: [
      "Pickpocket", "Smuggler", "Fence", "Forger", "Lookout", "Loan shark",
      "Con artist", "Bootlegger", "Gang enforcer", "Information broker"
    ]
  },
  noble: {
    label: "Noble Court & Politics",
    occupations: [
      "Advisor to the king", "Herald", "Courtier", "Steward", "Tax collector",
      "Diplomat's aide", "Court scribe", "Chamberlain", "Minor noble", "Petitioner to the court"
    ]
  },
  dock: {
    label: "Dock & Sailor",
    occupations: [
      "Dockworker", "Fisher", "Sailor", "Harbor master", "Net-mender",
      "Shipwright", "Cargo inspector", "Ferryman", "Rope maker", "Lighthouse keeper"
    ]
  },
  religious: {
    label: "Religious & Temple",
    occupations: [
      "Acolyte", "Temple caretaker", "Gravedigger", "Bell ringer", "Pilgrim guide",
      "Relic keeper", "Choir singer", "Almoner", "Candle maker for the shrine", "Wandering preacher"
    ]
  },
  scholar: {
    label: "Scholarly & Arcane",
    occupations: [
      "Scribe", "Cartographer", "Alchemist's apprentice", "Librarian", "Hedge wizard",
      "Tutor", "Archivist", "Translator", "Astronomer's assistant", "Bookbinder"
    ]
  },
  artisan: {
    label: "Artisan & Trade",
    occupations: [
      "Blacksmith", "Tailor", "Locksmith", "Cooper", "Weaver",
      "Carpenter", "Potter", "Glassblower", "Jeweler", "Leatherworker"
    ]
  },
  wilderness: {
    label: "Wilderness & Frontier",
    occupations: [
      "Hunter", "Trapper", "Woodcutter", "Herbalist", "Wilderness guide",
      "Trail scout", "Charcoal burner", "Beast tamer", "Prospector", "Ranger's aide"
    ]
  },
  street: {
    label: "Entertainer & Street",
    occupations: [
      "Street performer", "Fortune teller", "Courier", "Beggar", "Rat catcher",
      "Toll collector", "Street vendor", "Juggler", "Pamphleteer", "Chimney sweep"
    ]
  }
};

const THEME_KEYS = Object.keys(OCCUPATION_THEMES);

function pickFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/** All themes, for populating a select input. */
export function getOccupationThemes() {
  return THEME_KEYS.map(id => ({ id, label: OCCUPATION_THEMES[id].label }));
}

/**
 * Roll an occupation. With no theme (or "any"), pulls from every theme's pool combined.
 * @param {string} [themeId]
 * @returns {string}
 */
export function generateOccupation(themeId) {
  if (themeId && OCCUPATION_THEMES[themeId]) return pickFrom(OCCUPATION_THEMES[themeId].occupations);
  const combined = THEME_KEYS.flatMap(id => OCCUPATION_THEMES[id].occupations);
  return pickFrom(combined);
}
