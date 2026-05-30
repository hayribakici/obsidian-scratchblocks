import { MarkdownView, Plugin } from "obsidian";
import scratchblocks from "scratchblocks";

import { ScratchblocksSettingTab } from "./settings";
import { ScratchblocksEngine } from "./engine";
import { createBacktickedTextExtension } from "./editor-extension";
import { ScratchblocksExporter } from "./scratchblocks-exporter";
import { ScratchblocksRenderer } from "./scratchblocks-renderer";
import {
  getAllScratchblocksSources,
  getInlineScratchblocksSource,
  getScratchblocksFenceSource,
  getScratchblocksSource,
} from "./commands";

import type { LanguageCode, ScratchblocksSettings } from "./types";
import type { Menu } from "obsidian";

const DEFAULT_SETTINGS: ScratchblocksSettings = {
  languageCode: "en" as LanguageCode,
  style: "scratch3",
  scale: 1,
  showToolbar: true,
  pngFilenameTemplate: "scratchblocks_{firstLine}",
  pngExportPath: "current",
};

const FALLBACK_LANGUAGE = "en" as LanguageCode;
const fencedLanguagesPrefixes = ['scratchblock', 'scratchblocks', 'sb'];

export default class ScratchblocksPlugin extends Plugin {
  settings: ScratchblocksSettings;
  renderer: ScratchblocksEngine;
  private scratchblocksExporter: ScratchblocksExporter;
  private scratchblocksRenderer: ScratchblocksRenderer;

  async onload() {
    this.renderer = new ScratchblocksEngine();
    this.scratchblocksExporter = new ScratchblocksExporter(
      this.app.vault,
      this.renderer,
      () => this.settings
    );
    this.scratchblocksRenderer = new ScratchblocksRenderer(
      this.renderer,
      this.scratchblocksExporter,
      () => this.settings.showToolbar
    );

    await this.loadSettings();
    this.renderer.load();

    this.registerScratchblocksProcessors();
    this.registerCommands();
    this.registerEditorMenu();
    this.addSettingTab(new ScratchblocksSettingTab(this.app, this));
  }

  private registerScratchblocksProcessors() {
    this.registerMarkdownCodeBlockProcessor("scratchblock", (src, el, ctx) =>
      this.scratchblocksRenderer.renderCodeBlock(src, el, ctx.sourcePath)
    );
    this.registerMarkdownCodeBlockProcessor("scratchblocks", (src, el, ctx) =>
      this.scratchblocksRenderer.renderCodeBlock(src, el, ctx.sourcePath)
    );
    this.registerMarkdownPostProcessor((el) =>
      this.scratchblocksRenderer.renderInlineCodeElements(el)
    );
    this.registerEditorExtension(
      createBacktickedTextExtension(
        getInlineScratchblocksSource,
        (src) => this.scratchblocksRenderer.renderInlineCode(src)
      )
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
          void this.scratchblocksExporter.copyPNG(src);
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
          void this.scratchblocksExporter.exportAllPNG(sources, info.file?.path);
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
          void this.scratchblocksExporter.exportSVG(src, info.file?.path);
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

        this.addScratchblocksEditorMenuItems(
          menu,
          info.file?.path,
          src,
          sources
        );
      })
    );
  }

  private addScratchblocksEditorMenuItems(
    menu: Menu,
    sourcePath: string | undefined,
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
            void this.scratchblocksExporter.copyPNG(src);
          })
      );

      menu.addItem((item) =>
        item
          .setTitle("Export Scratchblocks to svg")
          .setIcon("file-code")
          .onClick(async () => {
            await this.scratchblocksExporter.exportSVG(src, sourcePath);
          })
      );

      menu.addItem((item) =>
        item
          .setTitle("Export Scratchblocks to png")
          .setIcon("download")
          .onClick(async () => {
            await this.scratchblocksExporter.exportPNG(src, sourcePath);
          })
      );
    }

    if (sources.length) {
      menu.addItem((item) =>
        item
          .setTitle("Export all Scratchblocks to png")
          .setIcon("download")
          .onClick(async () => {
            await this.scratchblocksExporter.exportAllPNG(sources, sourcePath);
          })
      );
    }
  }

  async loadSettings() {
    const loaded = await this.loadData();

    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);

    if (!scratchblocks.allLanguages[this.settings.languageCode]) {
      this.settings.languageCode = FALLBACK_LANGUAGE;
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
