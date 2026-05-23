import scratchblocks from "scratchblocks";

export type LanguageCode = keyof typeof scratchblocks.allLanguages;

export type ScratchblocksStyle =
    | "scratch2"
    | "scratch3"
    | "scratch3-high-contrast";

export type ScratchblocksPNGExportPath = "ask" | "current";

export interface ScratchblocksSettings {
    languageCode: LanguageCode;
    style: ScratchblocksStyle;
    scale: number;
    showToolbar: boolean;
    pngFilenameTemplate: string;
    pngExportPath: ScratchblocksPNGExportPath;
}
