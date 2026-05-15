import { setIcon } from "obsidian";

export function createRenderedBlock(src: string, svg: SVGElement): HTMLElement {
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

    const copySvgButton = toolbar.createEl("button", {
        cls: "scratchblocks-copy-button",
        attr: {
            "aria-label": "Copy SVG source",
            title: "Copy SVG source",
        },
    });

    setIcon(copySvgButton, "file-code");

    copySvgButton.addEventListener("click", async () => {
        const svgText = new XMLSerializer().serializeToString(svg);

        await navigator.clipboard.writeText(svgText);

        setIcon(copySvgButton, "check");

        window.setTimeout(() => {
            setIcon(copySvgButton, "file-code");
        }, 1200);
    });

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

    container.appendChild(svg);

    return container;
}