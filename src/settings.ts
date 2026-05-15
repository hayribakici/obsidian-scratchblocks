import { App, PluginSettingTab, Setting } from "obsidian";
import scratchblocks from "scratchblocks";

import type ScratchblocksPlugin from "./main";

import type { LanguageCode, ScratchblocksStyle } from "./types";

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
            .setDesc("Preview of the current settings")
            .settingEl.createDiv({
                cls: "scratchblocks-style-preview",
            });

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
