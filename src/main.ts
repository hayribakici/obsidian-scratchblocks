import { Plugin, PluginSettingTab, App, Setting } from "obsidian";
import scratchblocks from "scratchblocks";
import allLanguages from "scratchblocks/locales/all.js";

interface ScratchblocksSettings {
  language: string;
  style: string;
}

const DEFAULT_SETTINGS: ScratchblocksSettings = {
  language: "en",
  style: "scratch3",
};

let AVAILABLE_LANGUAGES: string[] = [];

export default class Scratchblocks extends Plugin {
  settings: ScratchblocksSettings;

  async onload() {
    try {
      await this.loadSettings();
      scratchblocks.loadLanguages(allLanguages);
      scratchblocks.appendStyles();

      AVAILABLE_LANGUAGES = Object.keys(scratchblocks.allLanguages).filter(
        (code) => code !== "en",
      );

      window["scratchblocks"] = scratchblocks;

      this.registerMarkdownCodeBlockProcessor("scratchblock", (src, el) => {
        const languages = ["en", this.settings.language].filter(
          (lang, index, self) => self.indexOf(lang) === index,
        );

        try {
          const doc = scratchblocks.parse(src, {
            languages: languages,
          });
          const svg = scratchblocks.render(doc, {
            style: this.settings.style,
          });

          if (svg) {
            el.replaceWith(svg);
          }
        } catch (error) {
          el.createEl("div", {
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            cls: "scratchblocks-error",
          });
          console.error("Scratchblocks render error:", error);
        }
      });

      this.addSettingTab(new ScratchblocksSettingTab(this.app, this));
    } catch (error) {
      console.error("Failed to load plugin:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "");
    }
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
      await this.saveData(this.settings);
      this.app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof MarkdownView) {
          leaf.view.previewMode?.rerender();
        }
      });
    }
  }
}

class ScratchblocksSettingTab extends PluginSettingTab {
  plugin: Scratchblocks;

  constructor(app: App, plugin: Scratchblocks) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Language")
      .setDesc("Select the language for Scratch blocks")
      .addDropdown((dropdown) => {
        dropdown.addOption("en", "English");

        AVAILABLE_LANGUAGES.sort().forEach((code) => {
          const langData = scratchblocks.allLanguages[code];
          const langName = langData?.name || code;
          dropdown.addOption(code, langName);
        });

        dropdown
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Style")
      .setDesc("Choose the visual style for Scratch blocks")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("scratch2", "Scratch 2")
          .addOption("scratch3", "Scratch 3")
          .addOption("scratch3-high-contrast", "Scratch 3 (High Contrast)")
          .setValue(this.plugin.settings.style)
          .onChange(async (value) => {
            this.plugin.settings.style = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
