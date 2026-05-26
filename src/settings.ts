import { App, PluginSettingTab, Setting } from "obsidian";
import scratchblocks from "scratchblocks";

import type ScratchblocksPlugin from "./main";

import type {
    LanguageCode,
    ScratchblocksPNGExportPath,
    ScratchblocksStyle,
} from "./types";

export class ScratchblocksSettingTab extends PluginSettingTab {
    plugin: ScratchblocksPlugin;
    stylePreviewDiv: HTMLDivElement | null = null;

    constructor(app: App, plugin: ScratchblocksPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const availableLanguages = (
            Object.keys(scratchblocks.allLanguages) as LanguageCode[]
        ).filter((code) => code !== "en");

        containerEl.createEl("h3", { text: "Display" });

        new Setting(containerEl)
            .setName("Show toolbar")
            .setDesc("Show export and copy buttons above rendered Scratch blocks")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showToolbar)
                    .onChange(async (value) => {
                        this.plugin.settings.showToolbar = value;
                        await this.plugin.saveSettings();

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
                    const langData = scratchblocks.allLanguages[code];
                    const langName = langData?.name || code;

                    dropdown.addOption(code, langName);
                });

                dropdown
                    .setValue(this.plugin.settings.languageCode)
                    .onChange(async (value) => {
                        this.plugin.settings.languageCode = value as LanguageCode;
                        await this.plugin.saveSettings();

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
                    .setValue(this.plugin.settings.style)
                    .onChange(async (value) => {
                        this.plugin.settings.style = value as ScratchblocksStyle;
                        await this.plugin.saveSettings();

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
                    .setValue(this.plugin.settings.scale)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.scale = value;
                        await this.plugin.saveSettings();

                        this.updateStylePreview();
                        this.plugin.refreshMarkdownViews();
                    })
            );

        this.stylePreviewDiv = new Setting(containerEl)
            .setName("Preview")
            .settingEl.createDiv({
                cls: "scratchblocks-style-preview",
            });

        containerEl.createEl("h3", { text: "Exporting" });

        new Setting(containerEl)
            .setName("PNG filename template")
            .setDesc("Use {firstLine} and/or {datetime}")
            .addText((text) =>
                text
                    .setPlaceholder("scratchblocks_{firstLine}")
                    .setValue(this.plugin.settings.pngFilenameTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.pngFilenameTemplate = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("PNG export location")
            .setDesc("Choose where PNG exports are saved")
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("ask", "Ask / default download")
                    .addOption("current", "Current note folder")
                    .setValue(this.plugin.settings.pngExportPath)
                    .onChange(async (value) => {
                        this.plugin.settings.pngExportPath =
                            value as ScratchblocksPNGExportPath;
                        await this.plugin.saveSettings();
                    })
            );

        this.updateStylePreview();
    }

    updateStylePreview(): void {
        if (!this.stylePreviewDiv) return;

        this.stylePreviewDiv.empty();

        const langData =
            scratchblocks.allLanguages[this.plugin.settings.languageCode];

        const greenFlagCmd =
            langData?.commands?.EVENT_WHENFLAGCLICKED ?? "when green flag clicked";

        const svg = this.plugin.renderer.getSVG(
            greenFlagCmd,
            [this.plugin.settings.languageCode],
            this.plugin.settings.style,
            this.plugin.settings.scale
        );

        this.stylePreviewDiv.appendChild(svg);
    }
}
