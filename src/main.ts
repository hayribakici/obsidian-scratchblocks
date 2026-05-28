import { MarkdownView, Notice, Plugin, TFile } from "obsidian";
import scratchblocks from "scratchblocks";

import { ScratchblocksSettingTab } from "./settings";
import { SBRenderer } from "./renderer";
import {
  copyPNGBlobToClipboard,
  exportAllScratchblocksPNG as exportScratchblocksPNGFiles,
  exportScratchblocksPNG,
  exportScratchblocksSVG,
  formatError,
  getAllScratchblocksSources,
  getAllScratchblocksSourcesFromText,
  getFirstLine,
  getScratchblocksFenceSource,
  getScratchblocksSource,
  SVG_MIME_TYPE,
} from "./commands";
import { createRenderedBlock } from "./rendered-block";

import type { LanguageCode, ScratchblocksSettings } from "./types";
import type {
  MarkdownFileInfo,
  MarkdownPostProcessorContext,
  Menu,
} from "obsidian";
import type { ExportOptions } from "./commands";

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
    this.registerMarkdownPostProcessor((el) =>
      this.renderInlineScratchblocks(el)
    );
  }

  private registerCommands() {
    this.addCommand({
      id: "scratchblocks-copy-svg",
      name: "Copy Scratchblocks png",
      editorCheckCallback: (checking, editor) => {
        const src = getScratchblocksSource(editor);

        if (!src) {
          return false;
        }

        if (!checking) {
          void this.copyScratchblocksPNG(src);
        }

        return true;
      },
    });

    this.addCommand({
      id: "export-all-png",
      name: "Export all Scratchblocks to png",
      editorCheckCallback: (checking, editor, info) => {
        const sources = getAllScratchblocksSources(editor);

        if (!sources.length) {
          return false;
        }

        if (!checking) {
          void this.exportAllScratchblocksPNG(sources, info.file?.path);
        }

        return true;
      },
    });

    this.addCommand({
      id: "export-svg",
      name: "Export Scratchblocks to svg",
      editorCheckCallback: (checking, editor, info) => {
        const src = getScratchblocksSource(editor);

        if (!src) {
          return false;
        }

        if (!checking) {
          void this.exportScratchblocksSVG(src, info.file?.path);
        }

        return true;
      },
    });
  }

  private registerEditorMenu() {
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, info) => {
        const src = getScratchblocksFenceSource(editor);
        const sources = getAllScratchblocksSources(editor);

        if (!src && !sources.length) {
          return;
        }

        this.addScratchblocksEditorMenuItems(menu, info, src, sources);
      })
    );
  }

  private addScratchblocksEditorMenuItems(
    menu: Menu,
    info: MarkdownView | MarkdownFileInfo,
    src: string | null,
    sources: string[]
  ) {
    menu.addSeparator();

    if (src) {
      menu.addItem((item) =>
        item
          .setTitle("Copy Scratchblocks png")
          .setIcon("image")
          .onClick(() => {
            void this.copyScratchblocksPNG(src);
          })
      );

      menu.addItem((item) =>
        item
          .setTitle("Export Scratchblocks to svg")
          .setIcon("file-code")
          .onClick(async () => {
            await this.exportScratchblocksSVG(src, info.file?.path);
          })
      );

      menu.addItem((item) =>
        item
          .setTitle("Export Scratchblocks to png")
          .setIcon("download")
          .onClick(async () => {
            await exportScratchblocksPNG(
              this.getExportOptions(src, info.file?.path)
            );
          })
      );
    }

    if (sources.length) {
      menu.addItem((item) =>
        item
          .setTitle("Export all Scratchblocks to png")
          .setIcon("download")
          .onClick(async () => {
            await this.exportAllScratchblocksPNG(sources, info.file?.path);
          })
      );
    }
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

      const rendered = createRenderedBlock(svg, {
        ...this.getExportOptions(src, ctx.sourcePath),
        exportAllPNG: () => this.exportAllScratchblocksPNGFromFile(ctx.sourcePath),
        showToolbar: this.settings.showToolbar,
      });

      el.replaceWith(rendered);
    } catch (error) {
      el.createEl("div", {
        text: `Error: ${formatError(error)}`,
        cls: "scratchblocks-error",
      });
    }
  }

  private renderInlineScratchblocks(el: HTMLElement) {
    const codeElements = [
      ...(el.matches("code") ? [el] : []),
      ...Array.from(el.querySelectorAll("code")),
    ];

    codeElements.forEach((codeEl) => {
      if (!(codeEl instanceof HTMLElement)) {
        return;
      }

      if (codeEl.closest("pre, .scratchblocks-inline-rendered")) {
        return;
      }

      const source = this.getInlineScratchblocksSource(codeEl.textContent ?? "");

      if (!source) {
        return;
      }

    codeEl.empty();
    codeEl.addClass("scratchblocks-inline-code");
    codeEl.appendChild(this.createInlineScratchblocksElement(source));
    });
  }

  private getInlineScratchblocksSource(text: string): string | null {
    const trimmed = text.trim();

    if (!trimmed.startsWith("[sb]")) {
      return null;
    }

    return trimmed.slice("[sb]".length).trim() || null;
  }

  private createInlineScratchblocksElement(src: string): HTMLElement {
    const container = document.createElement("span");
    container.addClass("scratchblocks-inline-rendered");
    container.setAttribute("aria-label", src);

    try {
      container.appendChild(
        this.renderer.getInlineSVG(
          src,
          this.getAllLanguages(),
          this.settings.style,
          0.5
        )
      );
    } catch (error) {
      container.addClass("scratchblocks-inline-error");
      container.setText(`[sb] ${src}`);
      container.setAttribute("title", formatError(error));
    }

    return container;
  }

  private renderPNGBlob(src: string): Promise<Blob> {
    return this.renderer.getPNGBlob(
      src,
      this.getAllLanguages(),
      this.settings.style,
      this.settings.scale
    );
  }

  private renderSVGString(src: string): string {
    return this.renderer.getSVGString(
      src,
      this.getAllLanguages(),
      this.settings.style,
      this.settings.scale
    );
  }

  private async copyScratchblocksPNG(src: string) {
    try {
      await copyPNGBlobToClipboard(await this.renderPNGBlob(src));
    } catch (error) {
      new Notice(`Scratchblocks PNG copy failed: ${formatError(error)}`);
    }
  }

  private async exportAllScratchblocksPNG(
    sources: string[],
    sourcePath?: string
  ) {
    try {
      await exportScratchblocksPNGFiles(
        sources.map((src) => this.getExportOptions(src, sourcePath))
      );
    } catch (error) {
      new Notice(`Scratchblocks PNG export failed: ${formatError(error)}`);
    }
  }

  private async exportScratchblocksSVG(src: string, sourcePath?: string) {
    try {
      await exportScratchblocksSVG(this.getExportOptions(src, sourcePath));
    } catch (error) {
      new Notice(`Scratchblocks SVG export failed: ${formatError(error)}`);
    }
  }

  private async exportAllScratchblocksPNGFromFile(sourcePath: string) {
    const file = this.app.vault.getAbstractFileByPath(sourcePath);

    if (!(file instanceof TFile)) {
      return;
    }

    const markdown = await this.app.vault.cachedRead(file);
    const sources = getAllScratchblocksSourcesFromText(markdown);

    if (sources.length) {
      await this.exportAllScratchblocksPNG(sources, sourcePath);
    }
  }

  private getExportOptions(
    src: string,
    sourcePath?: string
  ): ExportOptions {
    return {
      exportPath: this.settings.pngExportPath,
      filenameTemplate: this.settings.pngFilenameTemplate,
      firstLine: getFirstLine(src),
      pngBlob: () => this.renderPNGBlob(src),
      svgBlob: () => new Blob([this.renderSVGString(src)], {
        type: SVG_MIME_TYPE,
      }),
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
