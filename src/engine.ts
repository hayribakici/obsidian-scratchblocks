import scratchblocks from "scratchblocks";
import allLanguages from "scratchblocks/locales/all.js";
import type { LanguageCode, ScratchblocksStyle } from "./types";

export interface ScratchblocksRenderOptions {
  languages: LanguageCode[];
  style: ScratchblocksStyle;
  scale: number;
  inline?: boolean;
}

interface ScratchblocksView {
  render(): SVGElement;
  exportSVGString(): string;
  exportPNG(callback: (url: string) => void, scale?: number): void;
}

export class ScratchblocksEngine {
  load() {
    scratchblocks.loadLanguages(allLanguages);
    scratchblocks.appendStyles();
  }

  getSVG(src: string, options: ScratchblocksRenderOptions): SVGElement {
    return scratchblocks.render(this.parse(src, options.languages), {
      style: options.style,
      scale: options.scale,
      inline: options.inline,
    });
  }

  getSVGString(src: string, options: ScratchblocksRenderOptions): string {
    const view = this.getView(src, options);

    view.render();

    return view.exportSVGString();
  }

  async getPNGBlob(
    src: string,
    options: ScratchblocksRenderOptions
  ): Promise<Blob> {
    const view = this.getView(src, options);

    view.render();

    return new Promise((resolve, reject) => {
      view.exportPNG(async (url: string) => {
        try {
          if (!isLocalImageURL(url)) {
            throw new Error("Refusing to fetch a non-local Scratchblocks image URL");
          }

          const response = await fetch(url);

          resolve(await response.blob());
        } catch (error) {
          reject(error);
        } finally {
          if (url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
        }
      });
    });
  }

  private getView(
    src: string,
    options: ScratchblocksRenderOptions
  ): ScratchblocksView {
    const doc = this.parse(src, options.languages);

    return scratchblocks.newView(doc, {
      style: options.style,
      scale: options.scale,
    });
  }

  private parse(src: string, languages: LanguageCode[]) {
    return scratchblocks.parse(src, { languages });
  }
}

function isLocalImageURL(url: string): boolean {
  return url.startsWith("blob:") || url.startsWith("data:");
}
