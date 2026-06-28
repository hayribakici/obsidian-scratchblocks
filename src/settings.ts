import { App, PluginSettingTab, Setting } from "obsidian";

import type ScratchblocksPlugin from "./main";
import type { ScratchblocksWrapper } from "./wrapper";

import type {
    LanguageCode,
    ScratchblocksLocalSettings,
    ScratchblocksRenderOptions,
    ScratchblocksPNGExportPath as ScratchblocksPngExportPath,
    ScratchblocksGlobalSettings,
    ScratchblocksStyle,
} from "./utils/types";

const FALLBACK_LANGUAGE = "en" as LanguageCode;
const INLINE_SCALE = 0.4;

const DEFAULT_LOCAL_SETTINGS: ScratchblocksLocalSettings = {
    languageCode: "en" as LanguageCode,
    style: "scratch3",
    scale: 1.0,
};

export interface ScratchblocksExportSettings {
    filenameTemplate: string;
    exportPath: ScratchblocksPngExportPath;
}

export class ScratchblocksSettingsManager {
    constructor(private settings: ScratchblocksGlobalSettings) { }

    get(): ScratchblocksGlobalSettings {
        return this.settings;
    }

    update(settings: ScratchblocksGlobalSettings) {
        this.settings = settings;
    }

    patch(settings: Partial<ScratchblocksGlobalSettings>) {
        this.settings = {
            ...this.settings,
            ...settings,
        };
    }

    getBlockRenderOptions(
        localSettings: ScratchblocksLocalSettings = DEFAULT_LOCAL_SETTINGS
    ): ScratchblocksRenderOptions {
        const renderSettings = this.getRenderSettings(localSettings);

        return {
            languages: this.getRenderLanguages(renderSettings.languageCode),
            style: renderSettings.style,
            scale: renderSettings.scale,
            inline: false,
        };
    }

    getInlineRenderOptions(
        localSettings: ScratchblocksLocalSettings = DEFAULT_LOCAL_SETTINGS
    ): ScratchblocksRenderOptions {
        const renderSettings = this.getRenderSettings(localSettings);

        return {
            languages: this.getRenderLanguages(renderSettings.languageCode),
            style: renderSettings.style,
            scale: INLINE_SCALE,
            inline: true,
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

    private getRenderSettings(localSettings: ScratchblocksLocalSettings) {
        return {
            languageCode: localSettings.languageCode ?? this.settings.languageCode,
            style: localSettings.style ?? this.settings.style,
            scale: localSettings.scale ?? this.settings.scale,
        };
    }

    private getRenderLanguages(languageCode: LanguageCode): LanguageCode[] {
        if (languageCode === FALLBACK_LANGUAGE) {
            return [FALLBACK_LANGUAGE];
        }

        return [languageCode, FALLBACK_LANGUAGE];
    }
}

export class ScratchblocksSettingsPreview {
    constructor(
        private readonly plugin: ScratchblocksPlugin,
        private readonly wrapper: ScratchblocksWrapper
    ) { }

    getAvailableLanguageCodes(): LanguageCode[] {
        return this.wrapper
            .getLanguageCodes()
            .filter((code) => code !== FALLBACK_LANGUAGE);
    }

    getLanguageName(languageCode: LanguageCode): string {
        return this.wrapper.getLanguageName(languageCode);
    }

    createSvg(): SVGElement {
        const settings = this.plugin.getSettings();
        const command = this.wrapper.getGreenFlagCommand(settings.languageCode);

        return this.wrapper.createSvgElement(command, {
            languages: [settings.languageCode],
            style: settings.style,
            scale: settings.scale,
        });
    }
}

export class ScratchblocksSettingTab extends PluginSettingTab {
    plugin: ScratchblocksPlugin;
    preview: ScratchblocksSettingsPreview;
    stylePreviewDiv: HTMLDivElement | null = null;

    constructor(
        app: App,
        plugin: ScratchblocksPlugin,
        preview: ScratchblocksSettingsPreview
    ) {
        super(app, plugin);
        this.plugin = plugin;
        this.preview = preview;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const settings = this.plugin.getSettings();
        const availableLanguages = this.preview.getAvailableLanguageCodes();

        containerEl.createEl("h3", { text: "Display" });

        new Setting(containerEl)
            .setName("Show toolbar")
            .setDesc("Show export and copy buttons above rendered Scratch blocks")
            .addToggle((toggle) =>
                toggle
                    .setValue(settings.showToolbar)
                    .onChange(async (value) => {
                        await this.plugin.patchSettings({ showToolbar: value });

                        this.plugin.refreshMarkdownViews();
                    })
            );

        containerEl.createEl("h3", { text: "Rendering" });

        new Setting(containerEl)
            .setName("Language")
            .setDesc("Select the default language for Scratch blocks")
            .addDropdown((dropdown) => {
                dropdown.addOption("en", "English");

                availableLanguages.sort().forEach((code) => {
                    dropdown.addOption(code, this.preview.getLanguageName(code));
                });

                dropdown
                    .setValue(settings.languageCode)
                    .onChange(async (value) => {
                        await this.plugin.patchSettings({
                            languageCode: value as LanguageCode,
                        });

                        this.updateStylePreview();
                        this.plugin.refreshMarkdownViews();
                    });
            });

        new Setting(containerEl)
            .setName("Style")
            .setDesc("Choose the default visual style for Scratch blocks")
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("scratch2", "Scratch 2")
                    .addOption("scratch3", "Scratch 3")
                    .addOption("scratch3-high-contrast", "Scratch 3 High Contrast")
                    .setValue(settings.style)
                    .onChange(async (value) => {
                        await this.plugin.patchSettings({
                            style: value as ScratchblocksStyle,
                        });

                        this.updateStylePreview();
                        this.plugin.refreshMarkdownViews();
                    })
            );

        new Setting(containerEl)
            .setName("Scale")
            .setDesc("Scale rendered Scratch blocks")
            .addSlider((slider) =>
                slider
                    .setLimits(0.5, 2, 0.1)
                    .setValue(settings.scale)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        await this.plugin.patchSettings({ scale: value });

                        this.updateStylePreview();
                        this.plugin.refreshMarkdownViews();
                    })
            );

        this.stylePreviewDiv = new Setting(containerEl)
            .setName("Preview")
            .settingEl.createDiv({
                cls: "scratchblocks-style-preview",
            });
        this.updateStylePreview();

        containerEl.createEl("h3", { text: "Exporting" });

        new Setting(containerEl)
            .setName("PNG filename template")
            .setDesc("Use {firstLine} and/or {datetime}")
            .addText((text) =>
                text
                    .setPlaceholder("scratchblocks_{firstLine}")
                    .setValue(settings.pngFilenameTemplate)
                    .onChange(async (value) => {
                        await this.plugin.patchSettings({
                            pngFilenameTemplate: value,
                        });
                    })
            );

        new Setting(containerEl)
            .setName("PNG export location")
            .setDesc("Choose where PNG exports are saved")
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("ask", "Ask / default download")
                    .addOption("current", "Current note folder")
                    .setValue(settings.pngExportPath)
                    .onChange(async (value) => {
                        await this.plugin.patchSettings({
                            pngExportPath: value as ScratchblocksPngExportPath,
                        });
                    })
            );
    }

    updateStylePreview(): void {
        if (!this.stylePreviewDiv) return;

        this.stylePreviewDiv.empty();
        this.stylePreviewDiv.appendChild(this.preview.createSvg());
    }
}
