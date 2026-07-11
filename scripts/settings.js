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

  game.settings.register(MODULE_ID, SETTINGS.APPEND_FLAVOR_TO_BIOGRAPHY, {
    name: "NPC-GENERATOR-5E.Settings.AppendFlavor.Name",
    hint: "NPC-GENERATOR-5E.Settings.AppendFlavor.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
}
