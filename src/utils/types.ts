import type {
    LanguageCode,
    RenderOptions,
    ScratchblocksEngineOptions,
    ScratchblocksStyle,
} from "scratchblocks-ts";

export type {
    LanguageCode,
    RenderOptions,
    ScratchblocksEngineOptions,
    ScratchblocksStyle,
};

export const AUTO_LANGUAGE_CODE = "auto";

export const FRONTMATTER_KEY_LANG = "sb-lang";
export const FRONTMATTER_KEY_SCALE = "sb-scale";

export const SB_STYLE_SCRATCH2 = "scratch2";
export const SB_STYLE_SCRATCH3 = "scratch3";
export const SB_STYLE_SCRATCH3_HI = "scratch3-high-contrast";

export const SB_STYLES = [SB_STYLE_SCRATCH2, SB_STYLE_SCRATCH3, SB_STYLE_SCRATCH3_HI];

export type ScratchblocksPNGExportPath = "ask" | "current";

export interface RenderSettings {
    languageCode: string;
    style: ScratchblocksStyle;
    scale: number;
    showToolbar: boolean;
}

export interface ExportSettings {
    pngFilenameTemplate: string;
    pngExportPath: ScratchblocksPNGExportPath;
}

export type ScratchblocksSettings = RenderSettings & ExportSettings;
