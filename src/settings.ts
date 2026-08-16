import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

import { L } from "./i18n";
import { ScratchblocksEngine } from "scratchblocks-ts";

import type {
    LanguageCode,
    RenderOptions,
    ScratchblocksPNGExportPath,
    ScratchblocksSettings,
    ScratchblocksStyle,
} from "./utils/types";
import { AUTO_LANGUAGE_CODE } from "./utils/types";

const FALLBACK_LANGUAGE = "en" as LanguageCode;
const INLINE_SCALE = 0.4;

export interface ScratchblocksExportSettings {
    filenameTemplate: string;
    exportPath: ScratchblocksPNGExportPath;
}

export class ScratchblocksSettingsManager {

    constructor(
        private settings: ScratchblocksSettings,
        private autoLanguage: LanguageCode
    ) { }

    get(): ScratchblocksSettings {
        return this.settings;
    }

    update(settings: ScratchblocksSettings) {
        this.settings = settings;
    }

    patch(settings: Partial<ScratchblocksSettings>) {
        this.settings = {
            ...this.settings,
            ...settings,
        };
    }

    getRenderOptions(): RenderOptions {
        return {
            languages: this.getRenderLanguagesWithFallback(),
            style: this.settings.style,
            scale: this.settings.scale,
        };
    }

    getInlineRenderOptions(): RenderOptions {
        return {
            languages: this.getRenderLanguagesWithFallback(),
            style: this.settings.style,
            scale: INLINE_SCALE,
        };
    }

    getExportSettings(): ScratchblocksExportSettings {
        return {
            filenameTemplate: this.settings.pngFilenameTemplate,
            exportPath: this.settings.pngExportPath,
        };
    }

    getShowToolbar(): boolean {
        return this.settings.showToolbar;
    }

    getRenderLanguageCode(): LanguageCode {
        if (this.settings.languageCode === AUTO_LANGUAGE_CODE) {
            return this.autoLanguage;
        }

        return this.settings.languageCode;
    }

    private getRenderLanguagesWithFallback(): LanguageCode[] {
        const languageCode = this.getRenderLanguageCode();

        if (languageCode === FALLBACK_LANGUAGE) {
            return [FALLBACK_LANGUAGE];
        }

        return [languageCode, FALLBACK_LANGUAGE];
    }
}

export class ScratchblocksSettingTab extends PluginSettingTab {
    settings: ScratchblocksSettingsManager;
    stylePreviewDiv: HTMLDivElement | null = null;
    private settingsEngine: ScratchblocksEngine | null = null;

    constructor(
        app: App,
        plugin: Plugin,
        settings: ScratchblocksSettingsManager,
        private readonly onSettingsChanged: (refreshMarkdownViews?: boolean) => Promise<void>
    ) {
        super(app, plugin);
        this.settings = settings;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const settings = this.settings.get();
        const targetDocument = containerEl.ownerDocument;
        const engine = this.getEngine(targetDocument);

        new Setting(containerEl).setName(L.display()).setHeading();

        new Setting(containerEl)
            .setName(L.showToolbar())
            .setDesc(L.showToolbarDesc())
            .addToggle((toggle) =>
                toggle
                    .setValue(settings.showToolbar)
                    .onChange(async (value) => {
                        await this.patchSettings({ showToolbar: value }, true);
                    })
            );

        new Setting(containerEl).setName(L.rendering()).setHeading();

        new Setting(containerEl)
            .setName(L.language())
            .setDesc(L.selectLanguageDesc())
            .addDropdown((dropdown) => {
                dropdown.addOption(AUTO_LANGUAGE_CODE, L.automaticObsidian());

                engine.getLanguageCodes()
                    .sort()
                    .forEach((code) => {
                        dropdown.addOption(code, engine.getLanguageName(code));
                    });

                dropdown
                    .setValue(settings.languageCode)
                    .onChange(async (value) => {
                        await this.patchSettings({
                            languageCode: value,
                        }, true);

                        this.updateStylePreview();
                    });
            });

        new Setting(containerEl)
            .setName(L.style())
            .setDesc(L.styleDesc())
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("scratch2", "Scratch 2")
                    .addOption("scratch3", "Scratch 3")
                    .addOption("scratch3-high-contrast", "Scratch 3 high contrast")
                    .setValue(settings.style)
                    .onChange(async (value) => {
                        await this.patchSettings({
                            style: value as ScratchblocksStyle,
                        }, true);

                        this.updateStylePreview();
                    })
            );

        new Setting(containerEl)
            .setName(L.scale())
            .setDesc(L.scaleDesc())
            .addSlider((slider) =>
                slider
                    .setLimits(0.5, 2, 0.1)
                    .setValue(settings.scale)
                    .onChange(async (value) => {
                        await this.patchSettings({ scale: value }, true);

                        this.updateStylePreview();
                    })
            );

        this.stylePreviewDiv = new Setting(containerEl)
            .setName(L.preview())
            .settingEl.createDiv({
                cls: "scratchblocks-style-preview",
            });
        this.updateStylePreview();

        new Setting(containerEl).setName(L.exporting()).setHeading();

        new Setting(containerEl)
            .setName(L.pngFilenameTemplate())
            .setDesc(L.pngFilenameTemplateDesc())
            .addText((text) =>
                text
                    .setPlaceholder("scratchblocks_{firstLine}")
                    .setValue(settings.pngFilenameTemplate)
                    .onChange(async (value) => {
                        await this.patchSettings({
                            pngFilenameTemplate: value,
                        });
                    })
            );

        new Setting(containerEl)
            .setName(L.pngExportLocation())
            .setDesc(L.pngExportLocationDesc())
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("ask", L.askDefaultDownload())
                    .addOption("current", L.currentNoteFolder())
                    .setValue(settings.pngExportPath)
                    .onChange(async (value) => {
                        await this.patchSettings({
                            pngExportPath: value as ScratchblocksPNGExportPath,
                        });
                    })
            );
    }

    private async patchSettings(
        settings: Partial<ScratchblocksSettings>,
        refreshMarkdownViews?: boolean
    ) {
        this.settings.patch(settings);
        await this.onSettingsChanged(refreshMarkdownViews);
    }

    updateStylePreview(): void {
        if (!this.stylePreviewDiv) return;

        const engine = this.getEngine(this.stylePreviewDiv.ownerDocument);
        const languageCode = this.settings.getRenderLanguageCode();
        const command = engine.getGreenFlagCommand(languageCode);

        this.stylePreviewDiv.empty();
        this.stylePreviewDiv.appendChild(
            engine.toSVG(command, this.settings.getRenderOptions())
        );
    }

    private getEngine(targetDocument: Document): ScratchblocksEngine {
        return this.settingsEngine ??= ScratchblocksEngine.forDocument(
            targetDocument,
            { cacheSize: 0 }
        );
    }
}
