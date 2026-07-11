import { MODULE_ID } from "../constants.js";
import { generateNPC } from "../generator.js";
import { getAvailableBundledCRs } from "../statblocks.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function crToLabel(cr) {
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

export class NPCGeneratorApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "npc-generator-5e-app",
    tag: "form",
    window: {
      title: "NPC-GENERATOR-5E.App.Title",
      icon: "fa-solid fa-people-group",
      contentClasses: ["npc-generator-5e"]
    },
    position: { width: 420, height: "auto" },
    form: {
      handler: NPCGeneratorApp.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: false
    },
    actions: {}
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/npc-generator.hbs` }
  };

  _onRender(context, options) {
    super._onRender(context, options);
    const modeSelect = this.element.querySelector('select[name="crMode"]');
    const exactRows = this.element.querySelectorAll(".npc-gen-cr-exact");
    const rangeRows = this.element.querySelectorAll(".npc-gen-cr-range");

    const applyVisibility = () => {
      const mode = modeSelect.value;
      exactRows.forEach(row => row.classList.toggle("hidden", mode !== "exact"));
      rangeRows.forEach(row => row.classList.toggle("hidden", mode !== "range"));
    };

    modeSelect.addEventListener("change", applyVisibility);
    applyVisibility();
  }

  async _prepareContext() {
    const crOptions = await getAvailableBundledCRs();
    return {
      crModes: [
        { value: "exact", label: game.i18n.localize("NPC-GENERATOR-5E.App.ExactCR") },
        { value: "range", label: game.i18n.localize("NPC-GENERATOR-5E.App.RangeCR") },
        { value: "any", label: game.i18n.localize("NPC-GENERATOR-5E.App.AnyCR") }
      ],
      crOptions: crOptions.map(cr => ({ value: cr, label: crToLabel(cr) })),
      cultures: ["human", "elf", "dwarf", "halfling", "orcish"]
    };
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object;
    const params = { renderSheet: true };

    if (data.crMode === "exact" && data.exactCR !== "") {
      params.exactCR = Number(data.exactCR);
    } else if (data.crMode === "range") {
      if (data.minCR !== "") params.minCR = Number(data.minCR);
      if (data.maxCR !== "") params.maxCR = Number(data.maxCR);
    }

    if (data.culture && data.culture !== "random") params.culture = data.culture;

    const actor = await generateNPC(params);
    if (actor) {
      ui.notifications.info(game.i18n.format("NPC-GENERATOR-5E.App.Created", { name: actor.name }));
    }
  }
}
