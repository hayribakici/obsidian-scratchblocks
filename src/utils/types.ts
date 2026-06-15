import scratchblocks from "scratchblocks";

export type LanguageCode = keyof typeof scratchblocks.allLanguages;

export type ScratchblocksStyle =
    | "scratch2"
    | "scratch3"
    | "scratch3-high-contrast";

export type ScratchblocksPNGExportPath = "ask" | "current";

export interface ScratchblocksLocalSettings {
    languageCode?: LanguageCode;
    style?: ScratchblocksStyle;
    scale?: number;
}

export interface ScratchblocksGlobalSettings {
    languageCode: LanguageCode;
    style: ScratchblocksStyle;
    scale: number;
    showToolbar: boolean;
    pngFilenameTemplate: string;
    pngExportPath: ScratchblocksPNGExportPath;
}

export interface ScratchblocksRenderOptions {
    languages: LanguageCode[];
    style: ScratchblocksStyle;
    scale: number;
    inline?: boolean;
}
