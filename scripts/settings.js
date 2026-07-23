import { MODULE_ID, SETTINGS } from "./constants.js";

export function registerSettings() {
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

  // Same idea, but for the Species compendium checklist used to link a Species/Race
  // item onto every generated NPC regardless of generation mode.
  game.settings.register(MODULE_ID, SETTINGS.ENABLED_SPECIES_COMPENDIUMS, {
    scope: "client",
    config: false,
    type: Array,
    default: []
  });
}
