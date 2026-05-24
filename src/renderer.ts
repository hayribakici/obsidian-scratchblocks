import scratchblocks from "scratchblocks";
import allLanguages from "scratchblocks/locales/all.js";
import type { LanguageCode, ScratchblocksStyle } from "./types";

interface ScratchblocksView {
  render(): SVGElement;
  exportSVGString(): string;
  exportPNG(callback: (url: string) => void, scale?: number): void;
}

export class SBRenderer {
  load() {
    scratchblocks.loadLanguages(allLanguages);
    scratchblocks.appendStyles();
  }

  getSVG(
    src: string,
    languages: LanguageCode[],
    style: ScratchblocksStyle,
    scale: number
  ): SVGElement {
    return scratchblocks.render(scratchblocks.parse(src, { languages }), {
      style,
      scale,
    });
  }

  getSVGString(
    src: string,
    languages: LanguageCode[],
    style: ScratchblocksStyle,
    scale: number
  ): string {
    const view = this.getView(src, languages, style, scale);

    view.render();

    return view.exportSVGString();
  }

  async getPNGBlob(
    src: string,
    languages: LanguageCode[],
    style: ScratchblocksStyle,
    scale: number
  ): Promise<Blob> {
    const view = this.getView(src, languages, style, scale);

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
    languages: LanguageCode[],
    style: ScratchblocksStyle,
    scale: number
  ): ScratchblocksView {
    const doc = scratchblocks.parse(src, { languages });

    return scratchblocks.newView(doc, { style, scale });
  }
}

function isLocalImageURL(url: string): boolean {
  return url.startsWith("blob:") || url.startsWith("data:");
}
