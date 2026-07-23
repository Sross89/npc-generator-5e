# NPC Generator for 5e

A Foundry VTT module that generates random D&D 5e NPC actors by challenge rating (CR), with optional race/culture flavoring for names.

## Features

- **Roll, then review** — generating an NPC no longer creates the Actor immediately. It rolls a fully-editable draft into a review screen first: name, gender, occupation, ability scores, stat sheet (AC/HP/speed/senses), quirks & personality, and a small inventory list. Every field is hand-editable, and each section has its own **reroll** button, plus a global **Reroll All**. Nothing is written to the world until you click **Create Actor**.
- Three ways to roll the base creature:
  - **Random by CR** — pulled at random from the bundled/available pool by exact CR or CR range.
  - **Quick Template** — pick an archetype (Commoner, Bandit/Thug, Guard/Soldier, Veteran/Knight, Berserker/Brute, Scout/Archer, Spy/Rogue, Cultist/Acolyte, Priest, Mage, Noble/Courtier) and a CR, and ability scores, AC, HP, and attacks are auto-generated to roughly fit that CR — no need to hunt for the "right" bundled stat block. Spellcasting archetypes (Cultist, Priest, Mage) also get a small rolled package of cantrips/spells written into a Spellcasting feature, flavor-text only (no slots/prepared-spell tracking — this isn't a monster-building engine).
  - **Choose a specific actor** — check any number of Actor compendiums you have access to (a Monster Manual pack you own, a homebrew pack, etc.) and pick one exact template out of the combined list (e.g. "Guard"). Its stat sheet can't be re-rolled (you picked it on purpose), but every other field still can be, and you can toggle whether its weapons/features and artwork/token carry over.
- Ships with all 20 SRD 5.1 open-content "NPC" stat blocks (Commoner, Guard, Scout, Thug, Cultist, Cult Fanatic, Bandit, Bandit Captain, Berserker, Tribal Warrior, Veteran, Acolyte, Priest, Mage, Archmage, Assassin, Spy, Gladiator, Knight, Noble) spanning CR 0–12, so Random-by-CR works out of the box with no other content owned.
- **Occupation themes** — pick a theme (Tavern & Inn, Farm & Rural, Military & Guard, Criminal & Underworld, Noble Court, Dock & Sailor, Religious, Scholarly & Arcane, Artisan & Trade, Wilderness, Entertainer & Street) so a rolled occupation actually fits the setting, instead of a tavern worker rolling "Advisor to the King." Inventory items are drawn from the same theme.
- **Inventory with the occasional hook** — a few theme-appropriate mundane items, some pocket coin, and roughly a 1-in-5 chance of a notable trinket (a jeweled ring, a tiny statuette of some god, a key that doesn't fit anything nearby) for an NPC who looks poor but is carrying something interesting.
- **Compendium Links (Module Settings)** — wire up your own Item compendiums once, under **Configure Settings → Compendium Links**, instead of picking them every time you roll:
  - **Species** — linked Species/Race items appear in the generator's Species dropdown and get embedded on generated NPCs, across all three generation modes. This module doesn't parse or apply the item's ability score increases or choice-based traits itself — that's dnd5e's own Advancement system, so open the actor sheet's Advancements after creation to finish those, same as dropping the item on any actor normally would require.
  - **Equipment** — if any compendium is linked here, generated NPCs carry real Items pulled from it instead of the built-in flavor-text inventory list.
  - **Spells** — if any compendium is linked here, Quick Template spellcasters (Cultist, Priest, Mage) get real, castable Spell items pulled from it (matched to a CR-appropriate level) instead of flavor-text spell names, and the actor's spellcasting ability is set so its save DC computes correctly.
  
  Nothing needs to be configured — with no compendiums linked, species/inventory/spells all fall back to their original flavor-text-only behavior.
- **Bring your own tables**: point the module at a RollTable you own (e.g. built from a published sourcebook) to override name generation, and/or at an Actor compendium (e.g. one you've built or purchased, drawn from any published volume you own) to use as additional or alternative CR-bucketed generation sources in Random-by-CR mode. The module never bundles or redistributes copyrighted book content itself — only open SRD content and original tables — but happily uses your own legitimately-owned content (like an official Monster Manual compendium) if you wire it in or select it directly.

## Installation

1. In Foundry's **Add-on Modules** tab, click **Install Module**.
2. Paste this manifest URL:
   `https://raw.githubusercontent.com/Sross89/npc-generator-5e/master/module.json`
3. Enable **NPC Generator for 5e** in your world's Module Management.

## Usage

As GM, open the **Actors** directory sidebar tab and click the **Generate NPC** button at the bottom.

**Setup screen:** choose Random by CR (with a CR mode), Quick Template (archetype + CR), or Choose a Specific Actor (check compendiums, pick an actor), plus an optional name Culture, Occupation Theme, and Species (a plain dropdown — "Random from linked," "None," or a specific species by name — populated from whatever you've wired up under Compendium Links), then click **Roll NPC**.

**Review screen:** every field is editable directly, and each section has a dice-icon reroll button next to its heading:
- **Name** and **Gender** — reroll independently; changing Gender doesn't auto-change the name, reroll Name afterward if you want them to match.
- **Species** — pick a different one directly in the dropdown, reroll for a new random pick, or set it to "None." Only active if you've linked a Species compendium under Compendium Links.
- **Occupation** — change the Theme dropdown, then reroll Occupation to pull from the new theme.
- **Abilities** — all six scores reroll together. For Random by CR / Choose a Specific Actor this is a plain 4d6-drop-lowest per score; for Quick Template it's the same roll but assigned highest-to-lowest down the archetype's priority order (so a Mage's reroll still comes out INT-primary).
- **Stat Sheet** — AC, HP, Speed, and Senses reroll together: Random by CR picks a new base creature from the roll pool, Quick Template regenerates from the same archetype+CR, and it's disabled when the NPC came from a specifically-chosen actor.
- **Quirks & Personality** — trait, ideal, bond, flaw, and quirk reroll together as one package.
- **Inventory** — if no Equipment compendium is linked, add/remove/edit flavor-text lines freely, or reroll the whole list. If one is linked, the list shows real Items instead — remove or reroll to swap them for a fresh random set, and Add Item pulls one more from the linked compendium.

**Reroll All** re-rolls every section at once. **Start Over** discards the draft and returns to the setup screen. **Create Actor** writes the current draft to a new Actor and opens its sheet — anything not covered by these fields can still be tweaked afterward on the sheet, as usual.

You can also call the API directly from a macro or the console — this skips the review screen and creates the Actor immediately:

```js
// Random by CR
await game.modules.get("npc-generator-5e").api.generateNPC({ exactCR: 1 });
await game.modules.get("npc-generator-5e").api.generateNPC({ minCR: 0.5, maxCR: 3, culture: "elf", theme: "tavern" });

// From a specific compendium actor
await game.modules.get("npc-generator-5e").api.generateNPCFromTemplate({
  packId: "dnd5e.monsters",
  actorId: "<actor id from the compendium>",
  culture: "human",
  theme: "military",
  includeItems: true,
  keepArtwork: false
});

// Quick Template (archetype + CR)
await game.modules.get("npc-generator-5e").api.generateNPCFromArchetype({
  archetypeId: "bandit",
  cr: 1,
  culture: "human",
  theme: "criminal"
});
```

## Settings

Configured under **Configure Settings → Module Settings**:

- **Compendium Links** (button, opens a config screen) — checklists to wire up which Item compendiums supply Species, Equipment, and Spells. See Features above.
- **Include Bundled SRD Stat Blocks** — toggle the built-in SRD pool on/off.
- **Custom Stat Block Compendium** — pack ID (e.g. `world.my-npcs`) of an Actor compendium to draw additional/alternative templates from, bucketed automatically by each actor's `system.details.cr`.
- **Name RollTable Override** — UUID of a RollTable to draw names from instead of the bundled name lists.

## Content & Licensing

- Code is MIT licensed — see [LICENSE](LICENSE).
- `scripts/data/srd-npc-statblocks.json` contains NPC stat blocks taken from the **System Reference Document 5.1** ("SRD 5.1") by Wizards of the Coast LLC, used under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/legalcode) — see [LICENSE](LICENSE) for the full attribution notice. No content from any other published book is bundled with this module, and no Wizards of the Coast trademarks or logos are used.
- Name, flavor, occupation, inventory, and archetype tables (`scripts/data/*.js`) are original content written for this project. `scripts/data/spells.js` lists SRD 5.1 spell names only, used as flavor text in a Spellcasting feature — no spell text is reproduced.

## Compatibility

- Foundry VTT v13+ (verified against v14)
- dnd5e system v4+ (verified against v5.3)

## Development

Plain ESM, no build step required. Clone/symlink this folder directly into your Foundry `Data/modules/` directory as `npc-generator-5e`.
