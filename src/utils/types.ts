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

export type ScratchblocksPNGExportPath = "ask" | "current";

export interface ScratchblocksSettings {
    languageCode: LanguageCode;
    style: ScratchblocksStyle;
    scale: number;
    showToolbar: boolean;
    pngFilenameTemplate: string;
    pngExportPath: ScratchblocksPNGExportPath;
}
