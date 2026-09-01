import { Menu, setIcon } from "obsidian";

import { L } from "./i18n";

import type { ScratchblocksExporter } from "./exporter";

export interface RenderedBlockOptions {
  source: string;
  sourcePath: string;
  showToolbar: boolean;
  exportAllPNG?: () => Promise<void>;
}

export class ScratchblocksToolbar {
  constructor(private readonly exporter: ScratchblocksExporter) { }

  wrapWithToolBarIfEnabled(
    svg: SVGElement,
    options: RenderedBlockOptions,
    targetDocument: Document
  ): HTMLElement {
    const container = targetDocument.createDiv({
      cls: "scratchblocks-rendered",
    });

    if (options.showToolbar) {
      const toolbar = container.createDiv({
        cls: "scratchblocks-actions",
      });

      this.appendCopyPNGButton(toolbar, options.source);
      this.appendDownloadSVGButton(toolbar, options);
      this.appendDownloadPNGButton(toolbar, options);
    }

    container.addEventListener("contextmenu", (event) => {
      this.addContextMenuItems(event, options);
    });

    container.appendChild(svg);

    return container;
  }

  private appendCopyPNGButton(toolbar: HTMLDivElement, src: string) {
    const button = toolbar.createEl("button", {
      cls: "scratchblocks-copy-button",
      attr: {
        "aria-label": L.copyPNGImage(),
      },
    });

    setIcon(button, "copy");

    button.addEventListener("click", () => {
      void this.runToolbarAction(
        button,
        "copy",
        () => this.exporter.copyPNG(src)
      );
    });
  }

  private appendDownloadPNGButton(toolbar: HTMLDivElement, options: RenderedBlockOptions) {
    const button = toolbar.createEl("button", {
      cls: "scratchblocks-copy-button",
      attr: {
        "aria-label": L.downloadPNG(),
      },
    });

    setIcon(button, "image-down");

    button.addEventListener("click", () => {
      void this.runToolbarAction(button, "image-down", () =>
        this.exporter.exportPNG(options.source, options.sourcePath)
      );
    });
  }

  private appendDownloadSVGButton(toolbar: HTMLDivElement, options: RenderedBlockOptions) {
    const button = toolbar.createEl("button", {
      cls: "scratchblocks-copy-button",
      attr: {
        "aria-label": L.downloadSVG(),
      },
    });

    setIcon(button, "file-down");

    button.addEventListener("click", () => {
      void this.runToolbarAction(button, "file-down", () =>
        this.exporter.exportSVG(options.source, options.sourcePath)
      );
    });
  }

  private async runToolbarAction(button: HTMLButtonElement, defaultIcon: string, action: () => Promise<void>) {
    try {
      await action();

      setIcon(button, "check");
    } catch {
      setIcon(button, "x");
    }

    window.setTimeout(() => {
      setIcon(button, defaultIcon);
    }, 1200);
  }

  private addContextMenuItems(event: MouseEvent, options: RenderedBlockOptions) {
    const menu = new Menu();

    menu.addSeparator();

    menu.addItem((item) =>
      item
        .setTitle(L.copyScratchblocksPNG())
        .setIcon("image")
        .onClick(() => {
          void this.exporter.copyPNG(options.source);
        })
    );

    menu.addSeparator();

    menu.addItem((item) =>
      item
        .setTitle(L.exportScratchblocksSVG())
        .setIcon("file-code")
        .onClick(() => {
          void this.exporter.exportSVG(options.source, options.sourcePath);
        })
    );

    menu.addItem((item) =>
      item
        .setTitle(L.exportScratchblocksPNG())
        .setIcon("image-down")
        .onClick(() => {
          void this.exporter.exportPNG(options.source, options.sourcePath);
        })
    );

    if (options.exportAllPNG) {
      menu.addItem((item) =>
        item
          .setTitle(L.exportAllScratchblocksPNG())
          .setIcon("download")
          .onClick(() => {
            void options.exportAllPNG?.();
          })
      );
    }

    menu.showAtMouseEvent(event);
  }
}
