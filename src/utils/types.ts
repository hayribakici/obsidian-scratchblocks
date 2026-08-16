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

