import { MODULE_ID, SETTINGS } from "../constants.js";
import { getItemCompendiums } from "../compendium.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * World settings menu: wire up which Item compendiums supply Species, mundane
 * Equipment, and Spells to the generator. Configured once here rather than
 * re-picked every time an NPC is rolled.
 */
export class CompendiumLinksConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "npc-generator-5e-compendium-links",
    tag: "div",
    window: {
      title: "NPC-GENERATOR-5E.CompendiumLinks.Title",
      icon: "fa-solid fa-link",
      contentClasses: ["npc-generator-5e"]
    },
    position: { width: 480, height: "auto" }
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/compendium-links-config.hbs` }
  };

  _prepareContext() {
    const packs = getItemCompendiums();
    const species = game.settings.get(MODULE_ID, SETTINGS.SPECIES_COMPENDIUMS) ?? [];
    const items = game.settings.get(MODULE_ID, SETTINGS.ITEM_COMPENDIUMS) ?? [];
    const spells = game.settings.get(MODULE_ID, SETTINGS.SPELL_COMPENDIUMS) ?? [];

    return {
      hasPacks: !!packs.length,
      speciesPacks: packs.map(pack => ({ ...pack, checked: species.includes(pack.id) })),
      itemPacks: packs.map(pack => ({ ...pack, checked: items.includes(pack.id) })),
      spellPacks: packs.map(pack => ({ ...pack, checked: spells.includes(pack.id) }))
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector('[data-action="save"]')?.addEventListener("click", () => this.#onSave());
  }

  #onSave() {
    const el = this.element;
    const checkedValues = (cls) => Array.from(el.querySelectorAll(`.${cls}:checked`)).map(cb => cb.value);

    game.settings.set(MODULE_ID, SETTINGS.SPECIES_COMPENDIUMS, checkedValues("npc-gen-link-species"));
    game.settings.set(MODULE_ID, SETTINGS.ITEM_COMPENDIUMS, checkedValues("npc-gen-link-items"));
    game.settings.set(MODULE_ID, SETTINGS.SPELL_COMPENDIUMS, checkedValues("npc-gen-link-spells"));

    ui.notifications.info(game.i18n.localize("NPC-GENERATOR-5E.CompendiumLinks.Saved"));
    this.close();
  }
}
