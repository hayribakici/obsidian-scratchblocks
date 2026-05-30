import type { Editor } from "obsidian";

const INLINE_SCRATCHBLOCKS_PREFIX = "sb ";

export function getScratchblocksSource(editor: Editor): string | null {
    const selection = editor.getSelection().trim();

    if (selection) {
        return selection;
    }

    return getScratchblocksFenceSource(editor);
}

export function getInlineScratchblocksSource(text: string): string | null {
    const trimmed = text.trim();

    if (!trimmed.toLowerCase().startsWith(INLINE_SCRATCHBLOCKS_PREFIX)) {
        return null;
    }

    return trimmed.slice(INLINE_SCRATCHBLOCKS_PREFIX.length).trim() || null;
}

export function getScratchblocksFenceSource(editor: Editor): string | null {
    const openingFence = findOpeningScratchblocksFence(
        editor,
        editor.getCursor().line
    );

    if (openingFence === -1) {
        return null;
    }

    const closingFence = findClosingFence(editor, openingFence + 1);

    if (closingFence === -1) {
        return null;
    }

    const src = editor
        .getRange({ line: openingFence + 1, ch: 0 }, { line: closingFence, ch: 0 })
        .trim();

    return src || null;
}

export function getAllScratchblocksSources(editor: Editor): string[] {
    return getAllScratchblocksSourcesFromText(editor.getValue());
}

export function getAllScratchblocksSourcesFromText(text: string): string[] {
    const sources: string[] = [];
    let fenceMarker = "";
    let sourceStartLine = -1;
    const lines = text.split(/\r?\n/);

    for (let line = 0; line < lines.length; line++) {
        const content = lines[line];

        if (!fenceMarker) {
            fenceMarker = getFenceMarker(content);

            if (fenceMarker && isScratchblocksFence(content)) {
                sourceStartLine = line + 1;
            }

            continue;
        }

        if (isClosingFence(content, fenceMarker)) {
            if (sourceStartLine !== -1) {
                const src = lines.slice(sourceStartLine, line).join("\n").trim();

                if (src) {
                    sources.push(src);
                }
            }

            fenceMarker = "";
            sourceStartLine = -1;
        }
    }

    return sources;
}

function findOpeningScratchblocksFence(editor: Editor, cursorLine: number): number {
    let fenceMarker = "";
    let openingFence = -1;

    for (let line = 0; line <= cursorLine; line++) {
        const content = editor.getLine(line);

        if (!fenceMarker) {
            fenceMarker = getFenceMarker(content);

            if (fenceMarker && isScratchblocksFence(content)) {
                openingFence = line;
            }

            continue;
        }

        if (isClosingFence(content, fenceMarker)) {
            fenceMarker = "";
            openingFence = -1;
        }
    }

    return openingFence;
}

function findClosingFence(editor: Editor, startLine: number): number {
    const fenceMarker = getFenceMarker(editor.getLine(startLine - 1));

    if (!fenceMarker) {
        return -1;
    }

    for (let line = startLine; line < editor.lineCount(); line++) {
        if (isClosingFence(editor.getLine(line), fenceMarker)) {
            return line;
        }
    }

    return -1;
}

function getFenceMarker(line: string): string {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
        return "`";
    }

    if (trimmed.startsWith("~~~")) {
        return "~";
    }

    return "";
}

function isClosingFence(line: string, fenceMarker: string): boolean {
    const trimmed = line.trim();

    if (fenceMarker === "`") {
        return trimmed === "```";
    }

    if (fenceMarker === "~") {
        return trimmed === "~~~";
    }

    return false;
}

function isScratchblocksFence(line: string): boolean {
    const trimmed = line.trim().toLowerCase();

    return [
        "```scratchblock",
        "```scratchblocks",
        "~~~scratchblock",
        "~~~scratchblocks",
    ].includes(trimmed);
}
