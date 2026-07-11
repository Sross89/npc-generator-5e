import { MODULE_ID } from "./constants.js";
import { registerSettings } from "./settings.js";
import { generateNPC } from "./generator.js";
import { NPCGeneratorApp } from "./apps/npc-generator-app.js";

Hooks.once("init", () => {
  registerSettings();

  game.modules.get(MODULE_ID).api = {
    generateNPC,
    openGenerator: () => new NPCGeneratorApp().render(true)
  };
});

Hooks.on("getActorDirectoryEntryContext", () => {});

Hooks.on("renderActorDirectory", (app, html) => {
  if (!game.user.isGM) return;

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("npc-generator-5e-open");
  button.innerHTML = `<i class="fa-solid fa-dice-d20"></i> ${game.i18n.localize("NPC-GENERATOR-5E.App.SidebarButton")}`;
  button.addEventListener("click", () => new NPCGeneratorApp().render(true));

  const root = html instanceof HTMLElement ? html : html[0];
  const footer = root.querySelector(".directory-footer") ?? root.querySelector(".directory-header");
  (footer ?? root).appendChild(button);
});
