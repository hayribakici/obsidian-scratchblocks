import {
  formatError,
  getInlineScratchblocksSource,
} from "./utils/utils";

import type { ScratchblocksToolbar } from "./toolbar";
import type { ScratchblocksEngine } from "scratchblocks-ts";
import type { RenderOptions } from "./utils/types";

interface ScratchblocksViewOptions {
  engine: ScratchblocksEngine;
  getShowToolbar(): boolean;
  exportAllPNGFromFile(sourcePath: string): Promise<void>;
}

export class ScratchblocksView {
  constructor(
    private readonly toolbar: ScratchblocksToolbar,
    private readonly options: ScratchblocksViewOptions
  ) { }

  renderInlineCode(
    src: string,
    targetDocument: Document,
    renderOptions: RenderOptions
  ): HTMLElement {
    const container = targetDocument.createDocumentFragment().createSpan({
      cls: "scratchblocks-inline-rendered",
    });

    try {
      const svg = this.options.engine.toInlineSVG(
        src,
        renderOptions
      );

      container.appendChild(svg);
    } catch (error) {
      container.createSpan({
        text: `Error: ${formatError(error)}`,
        cls: "scratchblocks-error",
      });
    }

    return container;
  }

  renderInlineCodeElements(
    el: HTMLElement,
    getRenderOptions: (textContext?: Element | null) => RenderOptions
  ) {
    el.querySelectorAll("code").forEach((codeEl) => {
      if (codeEl.closest("pre")) {
        return;
      }

      const src = getInlineScratchblocksSource(codeEl.textContent ?? "");

      if (!src) {
        return;
      }

      const rendered = this.renderInlineCode(
        src,
        codeEl.ownerDocument,
        getRenderOptions(codeEl.parentElement)
      );

      codeEl.replaceWith(rendered);
    });
  }

  renderCodeBlock(
    src: string,
    el: HTMLElement,
    sourcePath: string,
    renderOptions: RenderOptions
  ) {
    try {
      const svg = this.options.engine.toSVG(
        src,
        renderOptions
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
