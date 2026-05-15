import { MarkdownView, Plugin } from "obsidian";
import scratchblocks from "scratchblocks";

import { ScratchblocksSettingTab } from "./settings";
import { SBRenderer } from "./renderer";
import { createRenderedBlock } from "./ui/rendered-block";

import type { LanguageCode, ScratchblocksSettings } from "./types";

const DEFAULT_SETTINGS: ScratchblocksSettings = {
  languageCode: "en" as LanguageCode,
  style: "scratch3",
  scale: 1,
};

export default class ScratchblocksPlugin extends Plugin {
  settings: ScratchblocksSettings;
  renderer: SBRenderer;

  get language() {
    return scratchblocks.allLanguages[this.settings.languageCode];
  }

  async onload() {
    this.renderer = new SBRenderer();

    await this.loadSettings();
    this.renderer.load();

    const processor = (src: string, el: HTMLElement) => {
      const languages = Array.from(
        new Set<LanguageCode>([
          this.settings.languageCode,
          "en" as LanguageCode,
        ])
      );

      try {
        const svg = this.renderer.getSVG(
          src,
          languages,
          this.settings.style,
          this.settings.scale
        );

        const rendered = createRenderedBlock(src, svg);

        el.replaceWith(rendered);
      } catch (error) {
        el.createEl("div", {
          text: `Error: ${error instanceof Error ? error.message : String(error)
            }`,
          cls: "scratchblocks-error",
        });
      }
    };

    this.registerMarkdownCodeBlockProcessor("scratchblock", processor);
    this.registerMarkdownCodeBlockProcessor("scratchblocks", processor);

    this.addSettingTab(new ScratchblocksSettingTab(this.app, this));
  }

  async loadSettings() {
    const loaded = await this.loadData();

    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);

    if (!scratchblocks.allLanguages[this.settings.languageCode]) {
      this.settings.languageCode = "en" as LanguageCode;
    }

    if (
      !["scratch2", "scratch3", "scratch3-high-contrast"].includes(
        this.settings.style
      )
    ) {
      this.settings.style = "scratch3";
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  refreshMarkdownViews() {
    this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (leaf as any).rebuildView();
      }
    });
  }
}
