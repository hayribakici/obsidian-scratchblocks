import type { Editor, Vault } from "obsidian";
import type { ScratchblocksPNGExportPath } from "./types";

export const PNG_MIME_TYPE = "image/png";
export const SVG_MIME_TYPE = "image/svg+xml;charset=utf-8";
const INLINE_SCRATCHBLOCKS_PREFIX = "sb ";

export interface ExportOptions {
    firstLine: string;
    filenameTemplate: string;
    pngBlob: () => Promise<Blob>;
    svgBlob: () => Blob;
    exportPath?: ScratchblocksPNGExportPath;
    sourcePath?: string;
    vault?: Vault;
}

export function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export async function copyPNGBlobToClipboard(blob: Blob) {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("Copying PNG images to the clipboard is not supported");
    }

    const pngBlob = blob.type === PNG_MIME_TYPE ? blob : new Blob([blob], {
        type: PNG_MIME_TYPE,
    });

    await navigator.clipboard.write([
        new ClipboardItem({
            [PNG_MIME_TYPE]: pngBlob,
        }),
    ]);
}

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

export async function exportScratchblocksSVG(options: ExportOptions) {
    await exportBlob(options.svgBlob(), options, "svg");
}

export async function exportScratchblocksPNG(options: ExportOptions) {
    const blob = await options.pngBlob();
    await exportBlob(blob, options, "png");
}

export async function exportAllScratchblocksPNG(options: ExportOptions[]) {
    for (const option of options) {
        const blob = await option.pngBlob();
        await exportBlob(blob, option, "png");
    }
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

export function getFirstLine(src: string): string {
    return src
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean) || "";
}

function getExportFilename(
    firstLine: string,
    template: string,
    extension: "png" | "svg"
): string {
    const filename = (template || "scratchblocks_{firstLine}")
        .replaceAll("{firstLine}", firstLine || "block")
        .replaceAll("{datetime}", getFilenameDateTime());
    const sanitized = sanitizeFilenamePart(filename) || "scratchblocks";

    return `${sanitized}.${extension}`;
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
        normalizeVaultPath(parentPath ? `${parentPath}/${filename}` : filename)
    );

    await vault.createBinary(targetPath, await blob.arrayBuffer());
}

async function exportBlob(
    blob: Blob,
    options: ExportOptions,
    extension: "png" | "svg"
) {
    const filename = getExportFilename(
        options.firstLine,
        options.filenameTemplate,
        extension
    );

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

function getParentPath(path: string): string {
    const lastSlash = path.lastIndexOf("/");

    return lastSlash === -1 ? "" : path.slice(0, lastSlash);
}

function normalizeVaultPath(path: string): string {
    return path.replace(/\\/g, "/").replace(/\/+/g, "/");
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
