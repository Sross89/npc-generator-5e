import { MODULE_ID, SETTINGS } from "./constants.js";
import { CompendiumLinksConfig } from "./apps/compendium-links-config.js";

export function registerSettings() {
  game.settings.registerMenu(MODULE_ID, "compendiumLinks", {
    name: "NPC-GENERATOR-5E.CompendiumLinks.MenuName",
    label: "NPC-GENERATOR-5E.CompendiumLinks.MenuLabel",
    hint: "NPC-GENERATOR-5E.CompendiumLinks.MenuHint",
    icon: "fa-solid fa-link",
    type: CompendiumLinksConfig,
    restricted: true
  });

  game.settings.register(MODULE_ID, SETTINGS.INCLUDE_BUNDLED_SRD, {
    name: "NPC-GENERATOR-5E.Settings.IncludeBundledSrd.Name",
    hint: "NPC-GENERATOR-5E.Settings.IncludeBundledSrd.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, SETTINGS.CUSTOM_STATBLOCK_PACK, {
    name: "NPC-GENERATOR-5E.Settings.CustomStatblockPack.Name",
    hint: "NPC-GENERATOR-5E.Settings.CustomStatblockPack.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
    filePicker: false
  });

  game.settings.register(MODULE_ID, SETTINGS.NAME_TABLE_UUID, {
    name: "NPC-GENERATOR-5E.Settings.NameTableUuid.Name",
    hint: "NPC-GENERATOR-5E.Settings.NameTableUuid.Hint",
    scope: "world",
    config: true,
    type: String,
    default: ""
  });

  // Remembers which Actor compendiums the GM has checked in the "Choose a Specific Actor"
  // panel, so the checklist doesn't reset every time the generator is reopened. Managed
  // entirely through the generator's own UI, not exposed in the Module Settings list.
  game.settings.register(MODULE_ID, SETTINGS.ENABLED_TEMPLATE_COMPENDIUMS, {
    scope: "client",
    config: false,
    type: Array,
    default: []
  });

  // Wired up via the "Compendium Links" menu above, not shown directly in this list.
  // World-scoped so every GM sees the same linked content.
  game.settings.register(MODULE_ID, SETTINGS.SPECIES_COMPENDIUMS, {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, SETTINGS.ITEM_COMPENDIUMS, {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, SETTINGS.SPELL_COMPENDIUMS, {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
}
