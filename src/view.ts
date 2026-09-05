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
    // create a DocumentFragment via the document/window helper so we can use createSpan on it
    const fragment = targetDocument.win.documentFragment();
    const container = fragment.createSpan({
      cls: "scratchblocks-inline-rendered",
    });

    try {
      const svg = this.options.engine.toInlineSVG(
        src,
        renderOptions
      );

      container.appendChild(svg);
    } catch (error) {
      const errorEl = fragment.createSpan({
        text: `Error: ${formatError(error)}`,
        cls: "scratchblocks-error",
      });
      container.appendChild(errorEl);
    }

    return container;
  }

  // Accept a function that derives RenderOptions from a text context.
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

      const renderOptions = getRenderOptions(codeEl.parentElement || null);
      const rendered = this.renderInlineCode(src, codeEl.ownerDocument, renderOptions);

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
