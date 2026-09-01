import { MarkdownView, Plugin, TFile, editorInfoField, editorLivePreviewField, getLanguage } from "obsidian";

import {
  ScratchblocksSettingTab,
  ScratchblocksSettingsManager,
} from "./settings";
import { ScratchblocksEngine } from "scratchblocks-ts";
import { createBacktickedTextExtension } from "./editor-extension";
import { ScratchblocksExporter } from "./exporter";
import { L } from "./i18n";
import { ScratchblocksToolbar } from "./toolbar";
import { ScratchblocksView } from "./view";
import {
  getAllScratchblocksSources,
  getInlineScratchblocksSource,
  getScratchblocksFenceSource,
  getScratchblocksSource,
  hasValidScratchblocksFrontmatter,
  isRecord,
} from "./utils/utils";

import {
  AUTO_LANGUAGE_CODE,
  SB_STYLE_SCRATCH3,
  SB_STYLES,
} from "./utils/types";

import type { ScratchblocksSettings } from "./utils/types";
import type { LanguageCode } from "scratchblocks-ts";
import type { Menu, TAbstractFile } from "obsidian";

const DEFAULT_SETTINGS: ScratchblocksSettings = {
  languageCode: AUTO_LANGUAGE_CODE,
  style: "scratch3",
  scale: 1,
  showToolbar: true,
  pngFilenameTemplate: "scratchblocks_{firstLine}",
  pngExportPath: "current",
};

const FALLBACK_LANGUAGE = "en";
const fencedLanguagesPrefixes = ['scratchblock', 'scratchblocks', 'sb'];

export default class ScratchblocksPlugin extends Plugin {
  private engine: ScratchblocksEngine;
  private settingsManager: ScratchblocksSettingsManager;
  private scratchblocksExporter: ScratchblocksExporter;
  private scratchblocksToolbar: ScratchblocksToolbar;
  private scratchblocksView: ScratchblocksView;

  async onload() {
    this.engine = ScratchblocksEngine.forDocument(document);
    this.settingsManager = new ScratchblocksSettingsManager(
      DEFAULT_SETTINGS,
      this.getAutoLanguageCode(),
      this
    );

    this.scratchblocksExporter = new ScratchblocksExporter(
      this.app.vault,
      this.engine,
      this.settingsManager
    );
    this.scratchblocksToolbar = new ScratchblocksToolbar(
      this.scratchblocksExporter
    );
    this.scratchblocksView = new ScratchblocksView(
      this.scratchblocksToolbar,
      {
        engine: this.engine,
        getShowToolbar: () => this.settingsManager.getShowToolbar(),
        exportAllPNGFromFile: (sourcePath: string) =>
          this.scratchblocksExporter.exportAllPNGFromFile(sourcePath),
      }
    );

    await this.loadSettings();

    this.registerScratchblocksProcessors();
    this.registerFrontmatterChangeHandler();
    this.registerCommands();
    this.registerEditorMenu();
    this.addSettingTab(
      new ScratchblocksSettingTab(
        this.app,
        this,
        this.settingsManager
      )
    );
  }

  private registerScratchblocksProcessors() {
    fencedLanguagesPrefixes.forEach((language) => {
      this.registerMarkdownCodeBlockProcessor(language, (src, el, ctx) => {
        const frontmatter = this.getFrontmatterFromSourcePath(ctx.sourcePath);
        const renderOptions = this.settingsManager.getRenderOptions(frontmatter);
        this.scratchblocksView.renderCodeBlock(src, el, ctx.sourcePath, renderOptions);
      });
    });
    this.registerMarkdownPostProcessor((el, ctx) => {
      const frontmatter = this.getFrontmatterFromSourcePath(ctx.sourcePath);
      const renderOptions = this.settingsManager.getInlineRenderOptions(frontmatter);
      this.scratchblocksView.renderInlineCodeElements(el, renderOptions);
    });
    this.registerEditorExtension(
      createBacktickedTextExtension(
        getInlineScratchblocksSource,
        (src, targetDocument, view) => {
          const file = view.state.field(editorInfoField).file;
          const frontmatter = this.getFrontmatterFromFile(file);
          const renderOptions = this.settingsManager.getInlineRenderOptions(frontmatter);
          return this.scratchblocksView.renderInlineCode(src, targetDocument, renderOptions);
        },
        editorLivePreviewField
      )
    );
  }

  private getFrontmatterFromSourcePath(sourcePath: string): unknown {
    const file = this.app.vault.getAbstractFileByPath(sourcePath);
    return this.getFrontmatterFromFile(file);
  }

  private getFrontmatterFromFile(file: TAbstractFile | null): unknown {
    if (!(file instanceof TFile)) {
      return undefined;
    }

    return this.app.metadataCache.getFileCache(file)?.frontmatter;
  }

  private registerFrontmatterChangeHandler() {
    this.registerEvent(this.app.metadataCache.on("changed", (_, __, cache) => {
      if (hasValidScratchblocksFrontmatter(cache.frontmatter)) {
        this.refreshMarkdownViews();
      }
    })
    );
  }

  private registerCommands() {
    this.addCommand({
      id: "copy-png",
      name: L.copyPNG(),
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
      name: L.exportAllScratchblocksPNG(),
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
      name: L.exportSVG(),
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
          .setTitle(L.copyScratchblocksPNG())
          .setIcon("image")
          .onClick(() => this.scratchblocksExporter.copyPNG(src))
      );

      menu.addItem((item) =>
        item
          .setTitle(L.exportScratchblocksSVG())
          .setIcon("file-code")
          .onClick(() => this.scratchblocksExporter.exportSVG(src, sourcePath))
      );

      menu.addItem((item) =>
        item
          .setTitle(L.exportScratchblocksPNG())
          .setIcon("download")
          .onClick(() => this.scratchblocksExporter.exportPNG(src, sourcePath))
      );
    }

    if (sources.length) {
      menu.addItem((item) =>
        item
          .setTitle(L.exportAllScratchblocksPNG())
          .setIcon("download")
          .onClick(() => this.scratchblocksExporter.exportAllPNG(sources, sourcePath))
      );
    }
  }

  async loadSettings() {
    const loaded: unknown = await this.loadData();

    const settings = {
      ...DEFAULT_SETTINGS,
      ...getSavedSettings(loaded),
    };

    if (settings.languageCode !== AUTO_LANGUAGE_CODE &&
      !this.engine.hasLanguage(settings.languageCode)) {
      settings.languageCode = FALLBACK_LANGUAGE;
    }

    if (!SB_STYLES.includes(settings.style)) {
      settings.style = SB_STYLE_SCRATCH3;
    }

    this.settingsManager.update(settings);
  }

  async saveSettings() {
    await this.saveData(this.settingsManager.get());
  }

  async onSettingsChanged(options?: { refreshMarkdownViews?: boolean }) {
    await this.saveSettings();

    if (options?.refreshMarkdownViews) {
      this.refreshMarkdownViews();
    }
  }

  hasLanguageCode(languageCode: string): boolean {
    return this.engine.hasLanguage(languageCode);
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

  /** Resolves the `auto` language into obsidians current set language. */
  private getAutoLanguageCode(): LanguageCode {
    const language = getLanguage();
    const candidates = [
      language,
      language.toLowerCase(),
      language.split("-")[0],
      language.split("_")[0],
    ];

    return candidates.find((candidate) => this.engine.hasLanguage(candidate)) ?? FALLBACK_LANGUAGE;
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
