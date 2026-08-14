import { formatError, getInlineScratchblocksSource } from "./utils/utils";

import type { ScratchblocksToolbar } from "./toolbar";
import type { ScratchblocksEngine } from "scratchblocks-ts";
import type { RenderOptions } from "./utils/types";

interface ScratchblocksViewOptions {
  engine: ScratchblocksEngine;
  getRenderOptions(): RenderOptions;
  getInlineRenderOptions(): RenderOptions;
  getShowToolbar(): boolean;
  exportAllPNGFromFile(sourcePath: string): Promise<void>;
}

export class ScratchblocksView {
  constructor(
    private readonly toolbar: ScratchblocksToolbar,
    private readonly options: ScratchblocksViewOptions
  ) {}

  renderInlineCode(src: string, targetDocument: Document): HTMLElement {
    const container = targetDocument.createElement("span");
    container.className = "scratchblocks-inline-rendered";

    try {
      const svg = this.options.engine.toInlineSVG(
        src,
        this.options.getInlineRenderOptions()
      );

      container.appendChild(svg);
    } catch (error) {
      const errorEl = targetDocument.createElement("span");
      errorEl.className = "scratchblocks-error";
      errorEl.textContent = `Error: ${formatError(error)}`;
      container.appendChild(errorEl);
    }

    return container;
  }

  renderInlineCodeElements(el: HTMLElement) {
    el.querySelectorAll("code").forEach((codeEl) => {
      if (codeEl.closest("pre")) {
        return;
      }

      const src = getInlineScratchblocksSource(codeEl.textContent ?? "");

      if (!src) {
        return;
      }

      codeEl.replaceWith(this.renderInlineCode(src, codeEl.ownerDocument));
    });
  }

  renderCodeBlock(
    src: string,
    el: HTMLElement,
    sourcePath: string
  ) {
    try {
      const svg = this.options.engine.toSVG(
        src,
        this.options.getRenderOptions()
      );

      const rendered = this.toolbar.wrapWithToolBarIfEnabled(svg, {
        source: src,
        sourcePath,
        exportAllPNG: () => this.options.exportAllPNGFromFile(sourcePath),
        showToolbar: this.options.getShowToolbar(),
      }, el.ownerDocument);

      el.replaceWith(rendered);
    } catch (error) {
      el.createDiv({
        text: `Error: ${formatError(error)}`,
        cls: "scratchblocks-error",
      });
    }
  }
}
