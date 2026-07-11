/**
 * Generic, original name tables used as the default (no-override) name source.
 * Not sourced from any published book — safe to bundle and redistribute.
 */
export const NAME_TABLES = {
  human: {
    first: {
      male: ["Aldric", "Bram", "Corwin", "Dain", "Edric", "Fenwick", "Garrick", "Halden", "Ivor", "Jarek",
        "Kellan", "Lorin", "Merrick", "Norwin", "Osric", "Perrin", "Quentin", "Roswald", "Stefan", "Tobias"],
      female: ["Alessa", "Brianne", "Cordelia", "Delphine", "Elowen", "Fiora", "Gwendolyn", "Halina", "Isolde", "Jessamine",
        "Katrin", "Lysandra", "Maren", "Nerissa", "Odalys", "Perenna", "Quilla", "Rosalind", "Seraphine", "Tamsin"],
      neutral: ["Ash", "Briar", "Corin", "Dael", "Ellery", "Fenn", "Gale", "Haven", "Idris", "Jules",
        "Kestrel", "Lark", "Marlowe", "Noor", "Onyx", "Piers", "Quinn", "Rune", "Sage", "Teal"]
    },
    last: ["Ashworth", "Blackwood", "Coldwater", "Dunmore", "Eastgate", "Fairweather", "Greymantle", "Hollowell",
      "Ironside", "Kestleigh", "Larkspur", "Merrowgate", "Norcross", "Oakhurst", "Pemberton", "Quillfeather",
      "Ravensworth", "Stonebridge", "Thornbury", "Whitlock"]
  },
  elf: {
    first: {
      male: ["Aerendyl", "Beliadir", "Caelynn", "Draven", "Elorfindar", "Faelar", "Galinndan", "Hadarai", "Immeral", "Jorildyn"],
      female: ["Adrie", "Birel", "Caelynn", "Dara", "Enna", "Faral", "Galinnden", "Ielenia", "Jelenneth", "Keyleth"],
      neutral: ["Ara", "Bryn", "Cael", "Dael", "Eryn", "Fira", "Gwyn", "Ilyra", "Joran", "Kaelis"]
    },
    last: ["Amakiir", "Amastacia", "Galanodel", "Holimion", "Liadon", "Meliamne", "Naïlo", "Siannodel", "Xiloscient", "Yerdanel"]
  },
  dwarf: {
    first: {
      male: ["Adrik", "Baern", "Darrak", "Eberk", "Fargrim", "Gardain", "Harbek", "Kildrak", "Morgran", "Orsik"],
      female: ["Amber", "Bardryn", "Dagnal", "Eldeth", "Falkrunn", "Gunnloda", "Helja", "Kathra", "Riswynn", "Torbera"],
      neutral: ["Brenn", "Darg", "Emrek", "Fenrik", "Gorin", "Hafrid", "Korrin", "Marrek", "Orik", "Thurn"]
    },
    last: ["Balderk", "Battlehammer", "Brawnanvil", "Dankil", "Fireforge", "Frostbeard", "Ironfist", "Loderr",
      "Rockseeker", "Steelfist"]
  },
  halfling: {
    first: {
      male: ["Alton", "Beau", "Cade", "Eldon", "Finnan", "Garret", "Lyle", "Milo", "Roscoe", "Wellby"],
      female: ["Andry", "Bree", "Callie", "Cora", "Euphemia", "Jillian", "Lavinia", "Nedda", "Seraphina", "Wren"],
      neutral: ["Berdie", "Cammy", "Din", "Kellen", "Nib", "Perry", "Robbie", "Sindri", "Tam", "Vesk"]
    },
    last: ["Brushgather", "Goodbarrel", "Greenbottle", "Highhill", "Hilltopple", "Leagallow", "Tealeaf",
      "Thorngage", "Tosscobble", "Underbough"]
  },
  orcish: {
    first: {
      male: ["Grosh", "Karg", "Mogar", "Ruk", "Thok", "Ugarth", "Vok", "Zarga", "Drukh", "Ohr"],
      female: ["Baggi", "Emen", "Kansif", "Neega", "Ovak", "Shautha", "Vola", "Yevelda", "Grura", "Ishara"],
      neutral: ["Duv", "Gore", "Krusk", "Muzgub", "Nagash", "Ront", "Shump", "Thruproduct", "Yark", "Zoraz"]
    },
    last: ["Bloodfang", "Grimtusk", "Ironhide", "Ragescar", "Skarrgut", "Splitjaw", "Thornhide", "Wargrip"]
  }
};

const CULTURES = Object.keys(NAME_TABLES);

function pickFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generate a random full name.
 * @param {object} [options]
 * @param {string} [options.culture] one of the NAME_TABLES keys; random if omitted
 * @param {string} [options.gender] "male" | "female" | "neutral"; random if omitted
 * @returns {{name: string, culture: string}}
 */
export function generateName({ culture, gender } = {}) {
  const cultureKey = culture && NAME_TABLES[culture] ? culture : pickFrom(CULTURES);
  const table = NAME_TABLES[cultureKey];
  const genderKey = gender && table.first[gender] ? gender : pickFrom(Object.keys(table.first));
  const first = pickFrom(table.first[genderKey]);
  const last = pickFrom(table.last);
  return { name: `${first} ${last}`, culture: cultureKey };
}
