import { normalizePath } from "obsidian";
import type { Editor, Vault } from "obsidian";
import type { ScratchblocksPNGExportPath } from "./types";

const SCRATCHBLOCKS_CODE_FENCE = /^(`{3,}|~{3,})\s*scratchblocks?\b.*$/;

export interface ExportOptions {
    firstLine: string;
    filenameTemplate: string;
    pngBlob: () => Promise<Blob>;
    exportPath?: ScratchblocksPNGExportPath;
    sourcePath?: string;
    vault?: Vault;
}

export function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export async function copyTextToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
}

export function getScratchblocksSource(editor: Editor): string | null {
    const selection = editor.getSelection().trim();

    if (selection) {
        return selection;
    }

    return getScratchblocksFenceSource(editor);
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

export async function exportScratchblocksPNG(options: ExportOptions) {
    const blob = await options.pngBlob();
    await exportPNGBlob(blob, options);
}

export async function exportAllScratchblocksPNG(options: ExportOptions[]) {
    for (const option of options) {
        const blob = await option.pngBlob();
        await exportPNGBlob(blob, option);
    }
}

export function getAllScratchblocksSources(editor: Editor): string[] {
    return getAllScratchblocksSourcesFromText(editor.getValue());
}

export function getAllScratchblocksSourcesFromText(text: string): string[] {
    const sources: string[] = [];
    let fence = "";
    let sourceStartLine = -1;
    const lines = text.split(/\r?\n/);

    for (let line = 0; line < lines.length; line++) {
        const content = lines[line];

        if (!fence) {
            fence = getFenceMarker(content);

            if (fence && SCRATCHBLOCKS_CODE_FENCE.test(content)) {
                sourceStartLine = line + 1;
            }

            continue;
        }

        if (isClosingFence(content, fence)) {
            if (sourceStartLine !== -1) {
                const src = lines.slice(sourceStartLine, line).join("\n").trim();

                if (src) {
                    sources.push(src);
                }
            }

            fence = "";
            sourceStartLine = -1;
        }
    }

    return sources;
}

export function getFirstLine(src: string): string {
    return src
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean) || "";
}

function getPNGFilename(firstLine: string, template: string): string {
    const filename = (template || "scratchblocks_{firstLine}")
        .replaceAll("{firstLine}", firstLine || "block")
        .replaceAll("{datetime}", getFilenameDateTime());
    const sanitized = sanitizeFilenamePart(filename) || "scratchblocks";

    return `${sanitized}.png`;
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function saveBlobToSourceFolder(
    blob: Blob,
    filename: string,
    vault: Vault,
    sourcePath: string
) {
    const parentPath = getParentPath(sourcePath);
    const targetPath = getUniqueVaultPath(
        vault,
        normalizePath(parentPath ? `${parentPath}/${filename}` : filename)
    );

    await vault.createBinary(targetPath, await blob.arrayBuffer());
}

async function exportPNGBlob(blob: Blob, options: ExportOptions) {
    const filename = getPNGFilename(options.firstLine, options.filenameTemplate);

    if (
        options.exportPath === "current" &&
        options.vault &&
        options.sourcePath
    ) {
        await saveBlobToSourceFolder(
            blob,
            filename,
            options.vault,
            options.sourcePath
        );
        return;
    }

    downloadBlob(blob, filename);
}

function findOpeningScratchblocksFence(editor: Editor, cursorLine: number): number {
    let fence = "";
    let openingFence = -1;

    for (let line = 0; line <= cursorLine; line++) {
        const content = editor.getLine(line);

        if (!fence) {
            fence = getFenceMarker(content);

            if (fence && SCRATCHBLOCKS_CODE_FENCE.test(content)) {
                openingFence = line;
            }

            continue;
        }

        if (isClosingFence(content, fence)) {
            fence = "";
            openingFence = -1;
        }
    }

    return openingFence;
}

function findClosingFence(editor: Editor, startLine: number): number {
    const fence = getFenceMarker(editor.getLine(startLine - 1));

    if (!fence) {
        return -1;
    }

    for (let line = startLine; line < editor.lineCount(); line++) {
        if (isClosingFence(editor.getLine(line), fence)) {
            return line;
        }
    }

    return -1;
}

function getFenceMarker(line: string): string {
    if (/^`{3,}/.test(line)) {
        return "`";
    }

    if (/^~{3,}/.test(line)) {
        return "~";
    }

    return "";
}

function isClosingFence(line: string, fence: string): boolean {
    if (fence === "`") {
        return /^`{3,}\s*$/.test(line);
    }

    return /^~{3,}\s*$/.test(line);
}

function getParentPath(path: string): string {
    const lastSlash = path.lastIndexOf("/");

    return lastSlash === -1 ? "" : path.slice(0, lastSlash);
}

function getUniqueVaultPath(vault: Vault, path: string): string {
    if (!vault.getAbstractFileByPath(path)) {
        return path;
    }

    const extensionStart = path.lastIndexOf(".");
    const base = extensionStart === -1 ? path : path.slice(0, extensionStart);
    const extension = extensionStart === -1 ? "" : path.slice(extensionStart);
    let index = 1;
    let candidate = `${base}-${index}${extension}`;

    while (vault.getAbstractFileByPath(candidate)) {
        index += 1;
        candidate = `${base}-${index}${extension}`;
    }

    return candidate;
}

function getFilenameDateTime(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");

    return [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate()),
    ].join("-") + "_" + [
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds()),
    ].join("-");
}

function sanitizeFilenamePart(value: string): string {
    return value
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 80);
}
