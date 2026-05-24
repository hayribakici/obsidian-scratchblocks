import { Menu, setIcon } from "obsidian";
import { copyTextToClipboard, exportScratchblocksPNG } from "./commands";
import type { ExportOptions } from "./commands";

interface RenderedBlockOptions extends ExportOptions {
    showToolbar: boolean;
    svgText: string;
    exportAllPNG?: () => Promise<void>;
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

    if (options.showToolbar) {
        const toolbar = container.createDiv({
            cls: "scratchblocks-toolbar",
        });

        appendCopySvgButtonToToolbar(toolbar, options.svgText);
        appendDownloadPngButtonToToolbar(toolbar, options);
        appendCopySourceButtonToToolbar(toolbar, src);
    }

    container.addEventListener("contextmenu", (event) => {
        addRenderedBlockContextMenuItems(event, src, options);
    });

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
        await copyTextToClipboard(src);

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
        await copyTextToClipboard(svgText);

        setIcon(copySvgButton, "check");

        window.setTimeout(() => {
            setIcon(copySvgButton, "file-code");
        }, 1200);
    });
    return copySvgButton;
}

function appendDownloadPngButtonToToolbar(
    toolbar: HTMLDivElement,
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
            await exportScratchblocksPNG(options);

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

function addRenderedBlockContextMenuItems(
    event: MouseEvent,
    src: string,
    options: RenderedBlockOptions
) {
    const menu = Menu.forEvent(event);

    menu.addSeparator();

    menu.addItem((item) =>
        item
            .setTitle("Copy Scratchblocks SVG")
            .setIcon("file-code")
            .onClick(async () => {
                await copyTextToClipboard(options.svgText);
            })
    );

    menu.addItem((item) =>
        item
            .setTitle("Export Scratchblocks PNG")
            .setIcon("download")
            .onClick(async () => {
                await exportScratchblocksPNG(options);
            })
    );

    if (options.exportAllPNG) {
        menu.addItem((item) =>
            item
                .setTitle("Export all Scratchblocks to png")
                .setIcon("download")
                .onClick(async () => {
                    await options.exportAllPNG();
                })
        );
    }

    menu.addItem((item) =>
        item
            .setTitle("Copy Scratchblocks source")
            .setIcon("copy")
            .onClick(async () => {
                await copyTextToClipboard(src);
            })
    );
}
