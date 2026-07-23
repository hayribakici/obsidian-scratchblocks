import { MarkdownView, Plugin, editorLivePreviewField } from "obsidian";

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

import type { ScratchblocksSettings } from "./utils/types";
import type { Menu } from "obsidian";

const DEFAULT_SETTINGS: ScratchblocksSettings = {
  languageCode: "en",
  style: "scratch3",
  scale: 1,
  showToolbar: true,
  pngFilenameTemplate: "scratchblocks_{firstLine}",
  pngExportPath: "current",
};

const FALLBACK_LANGUAGE = "en";
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
        getRenderOptions: (inline?: boolean) =>
          this.settingsManager.getRenderOptions(inline),
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
  }

  private registerScratchblocksProcessors() {
    fencedLanguagesPrefixes.forEach((language) => {
      this.registerMarkdownCodeBlockProcessor(language, (src, el, ctx) => {
        this.scratchblocksView.renderCodeBlock(src, el, ctx.sourcePath);
      });
    });
    this.registerMarkdownPostProcessor((el) => {
      this.scratchblocksView.renderInlineCodeElements(el);
    });
    this.registerEditorExtension(
      createBacktickedTextExtension(
        getInlineScratchblocksSource,
        (src) => this.scratchblocksView.renderInlineCode(src),
        editorLivePreviewField
      )
    );
  }

  private registerCommands() {
    this.addCommand({
      id: "copy-png",
      name: "Copy PNG",
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
      name: "Export all to PNG",
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
      name: "Export SVG",
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
          .onClick(() => {
            void this.scratchblocksExporter.exportSVG(src, sourcePath);
          })
      );

      menu.addItem((item) =>
        item
          .setTitle("Export Scratchblocks to png")
          .setIcon("download")
          .onClick(() => {
            void this.scratchblocksExporter.exportPNG(src, sourcePath);
          })
      );
    }

    if (sources.length) {
      menu.addItem((item) =>
        item
          .setTitle("Export all Scratchblocks to png")
          .setIcon("download")
          .onClick(() => {
            void this.scratchblocksExporter.exportAllPNG(sources, sourcePath);
          })
      );
    }
  }

  async loadSettings() {
    const loaded: unknown = await this.loadData();

    const settings = {
      ...DEFAULT_SETTINGS,
      ...getSavedSettings(loaded),
    };

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

  getSettings(): ScratchblocksSettings {
    return this.settingsManager.get();
  }

  async updateSettings(settings: ScratchblocksSettings) {
    this.settingsManager.update(settings);
    await this.saveSettings();
  }

  async patchSettings(settings: Partial<ScratchblocksSettings>) {
    this.settingsManager.patch(settings);
    await this.saveSettings();
  }

  refreshMarkdownViews() {
    this.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        const rebuildableLeaf = leaf as typeof leaf & {
          rebuildView?: () => void;
        };

        rebuildableLeaf.rebuildView?.();
      }
    });
  }
}

function getSavedSettings(value: unknown): Partial<ScratchblocksSettings> {
  if (!isRecord(value)) {
    return {};
  }

  const settings: Partial<ScratchblocksSettings> = {};

  if (typeof value.languageCode === "string") {
    settings.languageCode = value.languageCode;
  }

  if (value.pngExportPath === "ask" || value.pngExportPath === "current") {
    settings.pngExportPath = value.pngExportPath;
  }

  if (typeof value.pngFilenameTemplate === "string") {
    settings.pngFilenameTemplate = value.pngFilenameTemplate;
  }

  if (typeof value.scale === "number") {
    settings.scale = value.scale;
  }

  if (typeof value.showToolbar === "boolean") {
    settings.showToolbar = value.showToolbar;
  }

  if (
    value.style === "scratch2" ||
    value.style === "scratch3" ||
    value.style === "scratch3-high-contrast"
  ) {
    settings.style = value.style;
  }

  return settings;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
