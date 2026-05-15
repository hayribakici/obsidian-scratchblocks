import { Plugin, PluginSettingTab, App, Setting } from "obsidian";
import scratchblocks from "scratchblocks";
import allLanguages from "scratchblocks/locales/all.js";

type LanguageCode = keyof typeof scratchblocks.allLanguages;

type ScratchblocksStyle = "scratch2" | "scratch3" | "scratch3-high-contrast";

interface ScratchblocksSettings {
  languageCode: LanguageCode;
  style: ScratchblocksStyle;
}

const DEFAULT_SETTINGS: ScratchblocksSettings = {
  languageCode: "en" as LanguageCode,
  style: "scratch3",
};

let AVAILABLE_LANGUAGES: LanguageCode[] = [];

class SBWrapper {
  load() {
    scratchblocks.loadLanguages(allLanguages);
    scratchblocks.appendStyles();
  }

  getSVG(
    src: string,
    languages: LanguageCode[],
    style: ScratchblocksStyle
  ): SVGElement {
    const doc = scratchblocks.parse(src, {
      languages,
    });

    return scratchblocks.render(doc, {
      style,
    });
  }
}

export default class Scratchblocks extends Plugin {
  settings: ScratchblocksSettings;
  wrapper: SBWrapper;

  get language() {
    return scratchblocks.allLanguages[
      this.settings.languageCode as LanguageCode
    ];
  }

  async onload() {
    this.wrapper = new SBWrapper();

    try {
      await this.loadSettings();
      this.wrapper.load();

      AVAILABLE_LANGUAGES = Object.keys(
        scratchblocks.allLanguages
      ) as LanguageCode[];

      AVAILABLE_LANGUAGES = AVAILABLE_LANGUAGES.filter((code) => code !== "en");

      this.registerMarkdownCodeBlockProcessor("scratchblock", (src, el) => {
        const languages = Array.from(
          new Set<LanguageCode>([
            "en" as LanguageCode,
            this.settings.languageCode,
          ])
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
          .setValue(this.plugin.settings.languageCode)
          .onChange(async (value) => {
            this.plugin.settings.languageCode = value as LanguageCode;
            await this.plugin.saveSettings();
            this.updateStylePreview();
          });
      });

    new Setting(containerEl)
      .setName("Style")
      .setDesc("Choose the visual style for Scratch blocks")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("scratch2", "Scratch 2")
          .addOption("scratch3", "Scratch 3")
          .addOption("scratch3-high-contrast", "Scratch 3 High Contrast")
          .setValue(this.plugin.settings.style)
          .onChange(async (value) => {
            this.plugin.settings.style = value as ScratchblocksStyle;
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
    const langData = this.plugin.language();
    const greenFlagCmd = langData?.commands["EVENT_WHENFLAGCLICKED"];
    const svg = this.plugin.wrapper.getSVG(
      greenFlagCmd,
      [langData?.code as LanguageCode],
      this.plugin.settings.style
    );

    this.stylePreviewDiv.appendChild(svg);
  }
}
