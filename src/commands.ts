import { normalizePath, Notice } from "obsidian";
import type { Editor, Vault } from "obsidian";
import type { ScratchblocksPNGExportPath } from "./types";

const SVG_MIME_TYPE = "image/svg+xml;charset=utf-8";
const PNG_MIME_TYPE = "image/png";
const DEFAULT_PNG_FILENAME = "scratchblocks.png";
const SCRATCHBLOCKS_CODE_FENCE = /^`{3,}\s*scratchblocks?\b.*$/;
const CODE_FENCE = /^`{3,}\s*$/;

export async function copySourceAsSVG(
    src: string,
    renderSVGString: (src: string) => string
) {
    try {
        await navigator.clipboard.writeText(renderSVGString(src));

        new Notice("Copied Scratchblocks SVG");
    } catch (error) {
        new Notice(`Could not copy Scratchblocks SVG: ${formatError(error)}`);
    }
}

function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function getScratchblocksSource(editor: Editor): string | null {
    const selection = editor.getSelection().trim();

    if (selection) {
        return selection;
    }

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

export async function downloadSVGAsPNG(
    svgText: string,
    filename = DEFAULT_PNG_FILENAME,
    options?: {
        exportPath?: ScratchblocksPNGExportPath;
        sourcePath?: string;
        vault?: Vault;
    }
) {
    const image = await loadSVGImage(svgText);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Could not create PNG canvas");
    }

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    context.drawImage(image, 0, 0);

    const blob = await canvasToBlob(canvas);

    if (
        options?.exportPath === "current" &&
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
    let openingFence = -1;

    for (let line = 0; line <= cursorLine; line++) {
        const content = editor.getLine(line);

        if (openingFence === -1 && SCRATCHBLOCKS_CODE_FENCE.test(content)) {
            openingFence = line;
        } else if (openingFence !== -1 && CODE_FENCE.test(content)) {
            openingFence = -1;
        }
    }

    return openingFence;
}

function findClosingFence(editor: Editor, startLine: number): number {
    for (let line = startLine; line < editor.lineCount(); line++) {
        if (CODE_FENCE.test(editor.getLine(line))) {
            return line;
        }
    }

    return -1;
}

function loadSVGImage(svgText: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const blob = new Blob([svgText], { type: SVG_MIME_TYPE });
        const url = URL.createObjectURL(blob);
        const image = new Image();

        image.addEventListener("load", () => {
            URL.revokeObjectURL(url);
            resolve(image);
        });

        image.addEventListener("error", () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not load SVG for PNG export"));
        });

        image.src = url;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Could not create PNG"));
            }
        }, PNG_MIME_TYPE);
    });
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
