import { setIcon } from "obsidian";
import { downloadSVGAsPNG } from "./commands";
import type { App } from "obsidian";
import type { ScratchblocksPNGExportPath } from "./types";

interface RenderedBlockOptions {
    app: App;
    pngExportPath: ScratchblocksPNGExportPath;
    pngFilenameTemplate: string;
    sourcePath: string;
    svgText: string;
}

export function createRenderedBlock(
    src: string,
    svg: SVGElement,
    options: RenderedBlockOptions
): HTMLElement {
    const container = createDiv({
        cls: "scratchblocks-rendered",
        attr: {
            dir: "ltr",
        },
    });

    const width = svg.getAttribute("width");

    if (width) {
        container.style.width = `${width}px`;
    }

    const toolbar = container.createDiv({
        cls: "scratchblocks-toolbar",
    });

    appendCopySvgButtonToToolbar(toolbar, options.svgText);
    appendDownloadPngButtonToToolbar(
        toolbar,
        options.svgText,
        src,
        options.pngFilenameTemplate,
        options
    );
    appendCopySourceButtonToToolbar(toolbar, src);

    container.appendChild(svg);

    return container;
}

function appendCopySourceButtonToToolbar(toolbar: HTMLDivElement, src: string) {
    const copySourceButton = toolbar.createEl("button", {
        cls: "scratchblocks-copy-button",
        attr: {
            "aria-label": "Copy Scratchblocks source",
            title: "Copy Scratchblocks source",
        },
    });

    setIcon(copySourceButton, "copy");

    copySourceButton.addEventListener("click", async () => {
        await navigator.clipboard.writeText(src);

        setIcon(copySourceButton, "check");

        window.setTimeout(() => {
            setIcon(copySourceButton, "copy");
        }, 1200);
    });
    return copySourceButton;
}

function appendCopySvgButtonToToolbar(toolbar: HTMLDivElement, svgText: string) {
    const copySvgButton = toolbar.createEl("button", {
        cls: "scratchblocks-copy-button",
        attr: {
            "aria-label": "Copy SVG source",
            title: "Copy SVG source",
        },
    });

    setIcon(copySvgButton, "file-code");

    copySvgButton.addEventListener("click", async () => {
        await navigator.clipboard.writeText(svgText);

        setIcon(copySvgButton, "check");

        window.setTimeout(() => {
            setIcon(copySvgButton, "file-code");
        }, 1200);
    });
    return copySvgButton;
}

function appendDownloadPngButtonToToolbar(
    toolbar: HTMLDivElement,
    svgText: string,
    src: string,
    filenameTemplate: string,
    options: RenderedBlockOptions
) {
    const downloadPngButton = toolbar.createEl("button", {
        cls: "scratchblocks-copy-button",
        attr: {
            "aria-label": "Download PNG",
            title: "Download PNG",
        },
    });

    setIcon(downloadPngButton, "download");

    downloadPngButton.addEventListener("click", async () => {
        try {
            await downloadSVGAsPNG(svgText, getPNGFilename(src, filenameTemplate), {
                exportPath: options.pngExportPath,
                sourcePath: options.sourcePath,
                vault: options.app.vault,
            });

            setIcon(downloadPngButton, "check");

            window.setTimeout(() => {
                setIcon(downloadPngButton, "download");
            }, 1200);
        } catch {
            setIcon(downloadPngButton, "x");

            window.setTimeout(() => {
                setIcon(downloadPngButton, "download");
            }, 1200);
        }
    });
    return downloadPngButton;
}

function getPNGFilename(src: string, template: string): string {
    const firstLine = src
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);
    const filename = (template || "scratchblocks_{firstLine}")
        .replaceAll("{firstLine}", firstLine || "block")
        .replaceAll("{datetime}", getFilenameDateTime());
    const sanitized = sanitizeFilenamePart(filename) || "scratchblocks";

    return `${sanitized}.png`;
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
