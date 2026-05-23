import { MarkdownView, Plugin } from "obsidian";
import scratchblocks from "scratchblocks";

import { ScratchblocksSettingTab } from "./settings";
import { SBRenderer } from "./renderer";
import { copySourceAsSVG, getScratchblocksSource } from "./commands";
import { createRenderedBlock } from "./rendered-block";

import type { LanguageCode, ScratchblocksSettings } from "./types";
import type { MarkdownPostProcessorContext } from "obsidian";

const DEFAULT_SETTINGS: ScratchblocksSettings = {
  languageCode: "en" as LanguageCode,
  style: "scratch3",
  scale: 1,
  showToolbar: true,
  pngFilenameTemplate: "scratchblocks_{firstLine}",
  pngExportPath: "current",
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

    this.registerScratchblocksProcessors();
    this.registerCommands();
    this.addSettingTab(new ScratchblocksSettingTab(this.app, this));
  }

  private registerScratchblocksProcessors() {
    this.registerMarkdownCodeBlockProcessor("scratchblock", (src, el, ctx) =>
      this.renderScratchblocksCodeBlock(src, el, ctx)
    );
    this.registerMarkdownCodeBlockProcessor("scratchblocks", (src, el, ctx) =>
      this.renderScratchblocksCodeBlock(src, el, ctx)
    );
  }

  private registerCommands() {
    this.addCommand({
      id: "scratchblocks-copy-svg",
      name: "Copy Scratchblocks SVG",
      editorCheckCallback: (checking, editor) => {
        const src = getScratchblocksSource(editor);

        if (!src) {
          return false;
        }

        if (!checking) {
          void copySourceAsSVG(src, (source) => this.renderSVGString(source));
        }

        return true;
      },
    });
  }

  private renderScratchblocksCodeBlock(
    src: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) {
    try {
      const svg = this.renderer.getSVG(
        src,
        this.getLanguages(),
        this.settings.style,
        this.settings.scale
      );

      if (!this.settings.showToolbar) {
        el.replaceWith(svg);
        return;
      }

      const rendered = createRenderedBlock(src, svg, {
        app: this.app,
        pngExportPath: this.settings.pngExportPath,
        pngFilenameTemplate: this.settings.pngFilenameTemplate,
        sourcePath: ctx.sourcePath,
        svgText: this.renderSVGString(src),
      });

      el.replaceWith(rendered);
    } catch (error) {
      el.createEl("div", {
        text: `Error: ${this.formatError(error)}`,
        cls: "scratchblocks-error",
      });
    }
  }

  private renderSVGString(src: string): string {
    return this.renderer.getSVGString(
      src,
      this.getLanguages(),
      this.settings.style,
      this.settings.scale
    );
  }

  private getLanguages(): LanguageCode[] {
    return Array.from(
      new Set<LanguageCode>([
        this.settings.languageCode,
        "en" as LanguageCode,
      ])
    );
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
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
