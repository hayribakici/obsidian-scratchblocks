import { Menu, setIcon } from "obsidian";
import {
    copyPNGBlobToClipboard
} from "./scratchblocks-exporter";
import type { ExportOptions } from "./scratchblocks-exporter";

interface RenderedBlockOptions extends ExportOptions {
    showToolbar: boolean;
    exportAllPNG?: () => Promise<void>;
}
// TODO create a class out of this one.
export function createRenderedBlock(
    svg: SVGElement,
    options: RenderedBlockOptions
): HTMLElement {
    const container = createDiv({
        cls: "scratchblocks-rendered",
    });

    if (options.showToolbar) {
        const toolbar = container.createDiv({
            cls: "scratchblocks-actions",
        });

        appendCopyPngButtonToToolbar(toolbar, options);
        appendDownloadSvgButtonToToolbar(toolbar, options);
        appendDownloadPngButtonToToolbar(toolbar, options);
    }

    container.addEventListener("contextmenu", (event) => {
        addRenderedBlockContextMenuItems(event, options);
    });

    container.appendChild(svg);

    return container;
}

function appendCopyPngButtonToToolbar(
    toolbar: HTMLDivElement,
    options: RenderedBlockOptions
) {
    const copyPngButton = toolbar.createEl("button", {
        cls: "scratchblocks-copy-button",
        attr: {
            "aria-label": "Copy png image"
        },
    });

    setIcon(copyPngButton, "copy");

    copyPngButton.addEventListener("click", async () => {
        try {
            await copyPNGBlobToClipboard(await options.pngBlob());

            setIcon(copyPngButton, "check");

            window.setTimeout(() => {
                setIcon(copyPngButton, "copy");
            }, 1200);
        } catch {
            setIcon(copyPngButton, "x");

            window.setTimeout(() => {
                setIcon(copyPngButton, "copy");
            }, 1200);
        }
    });
    return copyPngButton;
}

function appendDownloadPngButtonToToolbar(
    toolbar: HTMLDivElement,
    options: RenderedBlockOptions
) {
    const downloadPngButton = toolbar.createEl("button", {
        cls: "scratchblocks-copy-button",
        attr: {
            "aria-label": "Download png",
        },
    });

    setIcon(downloadPngButton, "image-down");

    downloadPngButton.addEventListener("click", async () => {
        try {
            await exporter.exportScratchblocksPNG(options);

            setIcon(downloadPngButton, "check");

            window.setTimeout(() => {
                setIcon(downloadPngButton, "image-down");
            }, 1200);
        } catch {
            setIcon(downloadPngButton, "x");

            window.setTimeout(() => {
                setIcon(downloadPngButton, "image-down");
            }, 1200);
        }
    });
    return downloadPngButton;
}

function appendDownloadSvgButtonToToolbar(
    toolbar: HTMLDivElement,
    options: RenderedBlockOptions
) {
    const downloadSvgButton = toolbar.createEl("button", {
        cls: "scratchblocks-copy-button",
        attr: {
            "aria-label": "Download svg",
        },
    });

    setIcon(downloadSvgButton, "file-down");

    downloadSvgButton.addEventListener("click", async () => {
        try {
            await exportScratchblocksSVG(options);

            setIcon(downloadSvgButton, "check");

            window.setTimeout(() => {
                setIcon(downloadSvgButton, "file-down");
            }, 1200);
        } catch {
            setIcon(downloadSvgButton, "x");

            window.setTimeout(() => {
                setIcon(downloadSvgButton, "file-down");
            }, 1200);
        }
    });
    return downloadSvgButton;
}

function addRenderedBlockContextMenuItems(
    event: MouseEvent,
    options: RenderedBlockOptions
) {
    const menu = Menu.forEvent(event);

    menu.addSeparator();

    menu.addItem((item) =>
        item
            .setTitle("Copy Scratchblocks png")
            .setIcon("image")
            .onClick(async () => {
                await copyPNGBlobToClipboard(await options.pngBlob());
            })
    );

    menu.addSeparator();

    menu.addItem((item) =>
        item
            .setTitle("Export Scratchblocks to svg")
            .setIcon("file-code")
            .onClick(async () => {
                await exportScratchblocksSVG(options);
            })
    );

    menu.addItem((item) =>
        item
            .setTitle("Export Scratchblocks to png")
            .setIcon("image-down")
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

}
