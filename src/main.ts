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

class SBWrapper {
  SBWrapper() {}

  load() {
    scratchblocks.loadLanguages(allLanguages);
    scratchblocks.appendStyles();
  }

  getSVG(src: string, languages: string[], style: string): SVGElement {
    const doc = scratchblocks.parse(src, {
      languages: languages,
    });
    const svg = scratchblocks.render(doc, {
      style: style,
    });
    return svg;
  }
}

export default class Scratchblocks extends Plugin {
  settings: ScratchblocksSettings;
  wrapper: SBWrapper;

  async onload() {
    this.wrapper = new SBWrapper();

    try {
      await this.loadSettings();
      this.wrapper.load();

      AVAILABLE_LANGUAGES = Object.keys(scratchblocks.allLanguages).filter(
        (code) => code !== "en"
      );

      this.registerMarkdownCodeBlockProcessor("scratchblock", (src, el) => {
        const languages = ["en", this.settings.language].filter(
          (lang, index, self) => self.indexOf(lang) === index
        );
        try {
          const svg = this.wrapper.getSVG(src, languages, this.settings.style);
          el.replaceWith(svg);
        } catch (error) {
          el.createEl("div", {
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
            cls: "scratchblocks-error",
          });
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
  }
}

class ScratchblocksSettingTab extends PluginSettingTab {
  plugin: Scratchblocks;
  stylePreviewDiv: HTMLDivElement | null = null;

  constructor(app: App, plugin: Scratchblocks) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Language Setting (ohne Preview)
    new Setting(containerEl)
      .setName("Language")
      .setDesc("Select the language for Scratch blocks")
      .addDropdown((dropdown) => {
        dropdown.addOption("en", "English");

        AVAILABLE_LANGUAGES.sort().forEach((code) => {
          const langData = scratchblocks.allLanguages[code];
          const langName: string = langData?.name || code;
          dropdown.addOption(code, langName);
        });

        dropdown
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
          });
      });

    // Style Setting mit Preview direkt darunter (im selben Setting)
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
            this.updateStylePreview();
          })
      );

    this.stylePreviewDiv = new Setting(containerEl)
      .setName("Preview")
      .setDesc("Preview of the block style")
      .settingEl.createDiv({
        cls: "scratchblocks-style-preview",
      });

    this.updateStylePreview();
  }

  updateStylePreview(): void {
    if (!this.stylePreviewDiv) return;

    this.stylePreviewDiv.empty();

    const sb = this.plugin.wrapper;
    const svg = sb.getSVG(
      "When green flag clicked",
      ["en"],
      this.plugin.settings.style
    );

    this.stylePreviewDiv.appendChild(svg);
  }
}
