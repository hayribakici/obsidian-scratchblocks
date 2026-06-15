import { LRUCache } from "./utils/lru-cache";
import {
  getInlineScratchblocksSource,
} from "./utils/utils";
import { formatError } from "./utils/utils";

import type { ScratchblocksToolbar } from "./toolbar";
import type { ScratchblocksWrapper } from "./wrapper";
import type { ScratchblocksLocalSettings, ScratchblocksRenderOptions } from "./utils/types";

const MAX_INLINE_SVG_CACHE_ENTRIES = 25;

interface ScratchblocksViewOptions {
  getBlockRenderOptions(localSettings: ScratchblocksLocalSettings): ScratchblocksRenderOptions;
  getInlineRenderOptions(localSettings: ScratchblocksLocalSettings): ScratchblocksRenderOptions;
  getShowToolbar(): boolean;
  exportAllPNGFromFile(sourcePath: string): Promise<void>;
}

export class ScratchblocksView {
  private svgCache = new LRUCache<string, SVGElement>(
    MAX_INLINE_SVG_CACHE_ENTRIES
  );

  constructor(
    private readonly wrapper: ScratchblocksWrapper,
    private readonly toolbar: ScratchblocksToolbar,
    private readonly options: ScratchblocksViewOptions
  ) { }

  renderInlineCode(src: string, localSettings: ScratchblocksLocalSettings): HTMLElement {
    const container = createSpan({
      cls: "scratchblocks-inline-rendered",
    });

    try {
      const svg = this.getInlineSvg(src, localSettings);
      container.appendChild(svg);
    } catch (error) {
      container.createSpan({
        text: `Error: ${formatError(error)}`,
        cls: "scratchblocks-error",
      });
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

      codeEl.replaceWith(this.renderInlineCode(src));
    });
  }

  renderCodeBlock(src: string, el: HTMLElement, sourcePath: string, localSettings: ScratchblocksLocalSettings) {
    try {
      const svg = this.wrapper.createSvgElement(
        src,
        this.options.getBlockRenderOptions(localSettings)
      );

      const rendered = this.toolbar.wrapWithToolBarIfEnabled(svg, {
        source: src,
        sourcePath,
        exportAllPNG: () => this.options.exportAllPNGFromFile(sourcePath),
        showToolbar: this.options.getShowToolbar(),
      });

      el.replaceWith(rendered);
    } catch (error) {
      el.createEl("div", {
        text: `Error: ${formatError(error)}`,
        cls: "scratchblocks-error",
      });
    }
  }

  private getInlineSvg(src: string, localSettings: ScratchblocksLocalSettings): SVGElement {
    const options = this.options.getInlineRenderOptions(localSettings);
    const cacheKey = this.getInlineSvgCacheKey(src, options);
    const cached = this.svgCache.get(cacheKey);

    if (cached) {
      return cached.cloneNode(true) as SVGElement;
    }

    const svg = this.wrapper.createSvgElement(src, options);

    this.svgCache.set(cacheKey, svg.cloneNode(true) as SVGElement);

    return svg;
  }

  private getInlineSvgCacheKey(
    src: string,
    options: ScratchblocksRenderOptions
  ): string {
    return JSON.stringify({
      src,
      languages: options.languages,
      style: options.style,
      scale: options.scale,
      inline: options.inline,
    });
  }
}
