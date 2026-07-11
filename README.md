# NPC Generator for 5e

A Foundry VTT module that generates random D&D 5e NPC actors by challenge rating (CR), with optional race/culture flavoring for names.

## Features

- Generate a fully-built NPC `Actor` (abilities, AC, HP, movement, senses, skills, traits, and attacks) by exact CR or CR range.
- Ships with all 20 SRD 5.1 open-content "NPC" stat blocks (Commoner, Guard, Scout, Thug, Cultist, Cult Fanatic, Bandit, Bandit Captain, Berserker, Tribal Warrior, Veteran, Acolyte, Priest, Mage, Archmage, Assassin, Spy, Gladiator, Knight, Noble) spanning CR 0–12, so it works out of the box with no other content owned.
- Rolls a random name (with selectable culture) and a small flavor package (occupation, personality trait, ideal, bond, flaw, quirk) into the actor's biography, from bundled original tables.
- **Bring your own tables**: point the module at a RollTable you own (e.g. built from a published sourcebook) to override name generation, and/or at an Actor compendium (e.g. one you've built or purchased, drawn from any published volume you own) to use as additional or alternative CR-bucketed generation sources. The module never bundles or redistributes copyrighted book content itself — only open SRD content and original tables — but happily uses your own legitimately-owned content if you wire it in.

## Installation

1. In Foundry's **Add-on Modules** tab, click **Install Module**.
2. Paste this manifest URL:
   `https://raw.githubusercontent.com/simonalexross/npc-generator-5e/main/module.json`
3. Enable **NPC Generator for 5e** in your world's Module Management.

## Usage

1. As GM, open the **Actors** directory sidebar tab — click the **Generate NPC** button at the bottom.
2. Choose a CR mode (exact CR, a CR range, or any CR) and optionally a name culture.
3. Click **Generate NPC**. A new NPC actor is created and its sheet opens automatically.

You can also call the API directly from a macro or the console:

```js
await game.modules.get("npc-generator-5e").api.generateNPC({ exactCR: 1 });
await game.modules.get("npc-generator-5e").api.generateNPC({ minCR: 0.5, maxCR: 3, culture: "elf" });
```

## Settings

Configured under **Configure Settings → Module Settings**:

- **Include Bundled SRD Stat Blocks** — toggle the built-in SRD pool on/off.
- **Custom Stat Block Compendium** — pack ID (e.g. `world.my-npcs`) of an Actor compendium to draw additional/alternative templates from, bucketed automatically by each actor's `system.details.cr`.
- **Name RollTable Override** — UUID of a RollTable to draw names from instead of the bundled name lists.
- **Append Rolled Flavor to Biography** — toggle the occupation/personality/ideal/bond/flaw/quirk write-up.

## Content & Licensing

- Code is MIT licensed — see [LICENSE](LICENSE).
- `scripts/data/srd-npc-statblocks.json` contains stat blocks derived from the D&D 5th Edition **System Reference Document 5.1**, open-content usable under the Open Game License. No content from any other published book is bundled with this module.
- Name and flavor tables (`scripts/data/names.js`, `scripts/data/flavor.js`) are original content written for this project.

## Compatibility

- Foundry VTT v13+ (verified against v14)
- dnd5e system v4+ (verified against v5.3)

## Development

Plain ESM, no build step required. Clone/symlink this folder directly into your Foundry `Data/modules/` directory as `npc-generator-5e`.
