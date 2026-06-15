import { MarkdownView, Plugin, FileManager } from "obsidian";

import {
  ScratchblocksSettingTab,
  ScratchblocksSettingsManager,
  ScratchblocksSettingsPreview,
} from "./settings";
import { ScratchblocksWrapper } from "./wrapper";
import { createBacktickedTextExtension } from "./editor-extension";
import { ScratchblocksExporter } from "./exporter";
import { ScratchblocksToolbar } from "./toolbar";
import { ScratchblocksView } from "./view";
import {
  getAllScratchblocksSources,
  getInlineScratchblocksSource,
  getScratchblocksFenceSource,
  getScratchblocksSource,
} from "./utils/utils";

import type { LanguageCode, ScratchblocksGlobalSettings, ScratchblocksLocalSettings } from "./utils/types";
import type { Menu } from "obsidian";

const DEFAULT_SETTINGS: ScratchblocksGlobalSettings = {
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
  private wrapper: ScratchblocksWrapper;
  private settingsManager: ScratchblocksSettingsManager;
  private settingsPreview: ScratchblocksSettingsPreview;
  private scratchblocksExporter: ScratchblocksExporter;
  private scratchblocksToolbar: ScratchblocksToolbar;
  private scratchblocksView: ScratchblocksView;

  async onload() {
    this.wrapper = new ScratchblocksWrapper();
    this.wrapper.load();
    this.settingsManager = new ScratchblocksSettingsManager(DEFAULT_SETTINGS);
    this.settingsPreview = new ScratchblocksSettingsPreview(
      this,
      this.wrapper
    );

    this.scratchblocksExporter = new ScratchblocksExporter(
      this.app.vault,
      this.wrapper,
      this.settingsManager
    );
    this.scratchblocksToolbar = new ScratchblocksToolbar(
      this.scratchblocksExporter
    );
    this.scratchblocksView = new ScratchblocksView(
      this.wrapper,
      this.scratchblocksToolbar,
      {
        getBlockRenderOptions: (localSettings) =>
          this.settingsManager.getBlockRenderOptions(localSettings),
        getInlineRenderOptions: (localSettings) =>
          this.settingsManager.getInlineRenderOptions(localSettings),
        getShowToolbar: () => this.settingsManager.getShowToolbar(),
        exportAllPNGFromFile: (sourcePath: string) =>
          this.scratchblocksExporter.exportAllPNGFromFile(sourcePath),
      }
    );

    await this.loadSettings();

    this.registerScratchblocksProcessors();
    this.registerCommands();
    this.registerEditorMenu();
    this.addSettingTab(
      new ScratchblocksSettingTab(this.app, this, this.settingsPreview)
    );
    // this.app.fileManager.processFrontMatter(this.app.vault.fi)
  }

  private registerScratchblocksProcessors() {
    fencedLanguagesPrefixes.forEach((elem, _, __) => {
      this.registerMarkdownCodeBlockProcessor(elem, (src, el, ctx) => {
        const localSettings = this.getLocalSettings(ctx.sourcePath);
        this.scratchblocksView.renderCodeBlock(src, el, ctx.sourcePath, localSettings);
      })
    });
    this.registerMarkdownPostProcessor((el) =>
      this.scratchblocksView.renderInlineCodeElements(el)
    );
    this.registerEditorExtension(
      createBacktickedTextExtension(
        getInlineScratchblocksSource,
        (src) => this.scratchblocksView.renderInlineCode(src, {})
      )
    );
  }

  private registerCommands() {
    this.addCommand({
      id: "copy-png",
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

    const settings = Object.assign({}, DEFAULT_SETTINGS, loaded);

    if (!this.wrapper.hasLanguage(settings.languageCode)) {
      settings.languageCode = FALLBACK_LANGUAGE;
    }

    if (
      !["scratch2", "scratch3", "scratch3-high-contrast"].includes(
        settings.style
      )
    ) {
      settings.style = "scratch3";
    }

    this.settingsManager.update(settings);
  }

  async saveSettings() {
    await this.saveData(this.settingsManager.get());
  }

  getSettings(): ScratchblocksGlobalSettings {
    return this.settingsManager.get();
  }

  getLocalSettings(path: string): ScratchblocksLocalSettings {
    const fm = this.app.metadataCache.getCache(path)?.frontmatter;
    return {
      languageCode: fm?.['sb-lang'],
      style: fm?.['sb-style'],
      scale: fm?.['sb-scale']
    };
  }

  async patchSettings(settings: Partial<ScratchblocksGlobalSettings>) {
    this.settingsManager.patch(settings);
    await this.saveSettings();
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
