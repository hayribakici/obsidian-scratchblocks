import { MarkdownView, Plugin } from "obsidian";
import scratchblocks from "scratchblocks";

import { ScratchblocksSettingTab } from "./settings";
import { SBRenderer } from "./renderer";
import {
  copyTextToClipboard,
  exportScratchblocksPNG,
  formatError,
  getFirstLine,
  getScratchblocksFenceSource,
  getScratchblocksSource,
} from "./commands";
import { createRenderedBlock } from "./rendered-block";

import type { LanguageCode, ScratchblocksSettings } from "./types";
import type {
  MarkdownFileInfo,
  MarkdownPostProcessorContext,
  Menu,
} from "obsidian";
import type { PNGExportOptions } from "./commands";

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

  async onload() {
    this.renderer = new SBRenderer();

    await this.loadSettings();
    this.renderer.load();

    this.registerScratchblocksProcessors();
    this.registerCommands();
    this.registerEditorMenu();
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
          void copyTextToClipboard(this.renderSVGString(src));
        }

        return true;
      },
    });
  }

  private registerEditorMenu() {
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, info) => {
        const src = getScratchblocksFenceSource(editor);

        if (!src) {
          return;
        }

        this.addScratchblocksEditorMenuItems(menu, info, src);
      })
    );
  }

  private addScratchblocksEditorMenuItems(
    menu: Menu,
    info: MarkdownView | MarkdownFileInfo,
    src: string
  ) {
    menu.addSeparator();

    menu.addItem((item) =>
      item
        .setTitle("Copy Scratchblocks SVG")
        .setIcon("file-code")
        .onClick(() => {
          void copyTextToClipboard(this.renderSVGString(src));
        })
    );

    menu.addItem((item) =>
      item
        .setTitle("Export Scratchblocks PNG")
        .setIcon("download")
        .onClick(async () => {
          await exportScratchblocksPNG(
            this.getPNGExportOptions(src, info.file?.path)
          );
        })
    );
  }

  private renderScratchblocksCodeBlock(
    src: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) {
    try {
      const svg = this.renderer.getSVG(
        src,
        this.getAllLanguages(),
        this.settings.style,
        this.settings.scale
      );

      const rendered = createRenderedBlock(src, svg, {
        ...this.getPNGExportOptions(src, ctx.sourcePath),
        showToolbar: this.settings.showToolbar,
        svgText: this.renderSVGString(src),
      });

      el.replaceWith(rendered);
    } catch (error) {
      el.createEl("div", {
        text: `Error: ${formatError(error)}`,
        cls: "scratchblocks-error",
      });
    }
  }

  private renderSVGString(src: string): string {
    return this.renderer.getSVGString(
      src,
      this.getAllLanguages(),
      this.settings.style,
      this.settings.scale
    );
  }

  private renderPNGBlob(src: string): Promise<Blob> {
    return this.renderer.getPNGBlob(
      src,
      this.getAllLanguages(),
      this.settings.style,
      this.settings.scale
    );
  }

  private getPNGExportOptions(
    src: string,
    sourcePath?: string
  ): PNGExportOptions {
    return {
      exportPath: this.settings.pngExportPath,
      filenameTemplate: this.settings.pngFilenameTemplate,
      firstLine: getFirstLine(src),
      pngBlob: () => this.renderPNGBlob(src),
      sourcePath,
      vault: this.app.vault,
    };
  }

  private getAllLanguages(): LanguageCode[] {
    return Array.from(
      new Set<LanguageCode>([
        this.settings.languageCode,
        "en" as LanguageCode,
      ])
    );
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
