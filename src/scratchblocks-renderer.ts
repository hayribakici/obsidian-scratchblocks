import { LRUCache } from "./lru-cache";
import { createRenderedBlock } from "./rendered-block";
import {
  getInlineScratchblocksSource,
} from "./commands";
import { formatError } from "./utils";

import type { ExportOptions } from "./scratchblocks-exporter";
import type { ScratchblocksEngine, ScratchblocksRenderOptions } from "./engine";

const MAX_INLINE_SVG_CACHE_ENTRIES = 25;

interface ScratchblocksRendererExports {
  exportAllPNGFromFile(sourcePath: string): Promise<void>;
  getExportOptions(src: string, sourcePath?: string): ExportOptions;
  getRenderOptions(inline?: boolean): ScratchblocksRenderOptions;
}

export class ScratchblocksRenderer {
  private svgCache = new LRUCache<string, SVGElement>(
    MAX_INLINE_SVG_CACHE_ENTRIES
  );

  constructor(
    private readonly engine: ScratchblocksEngine,
    private readonly exporter: ScratchblocksRendererExports,
    private readonly getShowToolbar: () => boolean
  ) {}

  renderInlineCode(src: string): HTMLElement {
    const container = createSpan({
      cls: "scratchblocks-inline-rendered",
    });

    try {
      const svg = this.getInlineSVG(src);
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

  renderCodeBlock(
    src: string,
    el: HTMLElement,
    sourcePath: string
  ) {
    try {
      const svg = this.engine.getSVG(src, this.exporter.getRenderOptions());

      const rendered = createRenderedBlock(svg, {
        ...this.exporter.getExportOptions(src, sourcePath),
        exportAllPNG: () => this.exporter.exportAllPNGFromFile(sourcePath),
        showToolbar: this.getShowToolbar(),
      });

      el.replaceWith(rendered);
    } catch (error) {
      el.createEl("div", {
        text: `Error: ${formatError(error)}`,
        cls: "scratchblocks-error",
      });
    }
  }

  private getInlineSVG(src: string): SVGElement {
    const options = this.exporter.getRenderOptions(true);
    const cacheKey = this.getInlineSVGCacheKey(src, options);
    const cached = this.svgCache.get(cacheKey);

    if (cached) {
      return cached.cloneNode(true) as SVGElement;
    }

    const svg = this.engine.getSVG(src, options);

    this.svgCache.set(cacheKey, svg.cloneNode(true) as SVGElement);

    return svg;
  }

  private getInlineSVGCacheKey(
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
