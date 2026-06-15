import scratchblocks from "scratchblocks";
import allLanguages from "scratchblocks/locales/all.js";
import type { LanguageCode, ScratchblocksRenderOptions } from "./utils/types";

interface ScratchblocksView {
  render(): SVGElement;
  exportSVGString(): string;
  exportPNG(callback: (url: string) => void, scale?: number): void;
}

export class ScratchblocksWrapper {
  private loaded = false;

  load() {
    if (this.loaded) {
      return;
    }

    scratchblocks.loadLanguages(allLanguages);
    scratchblocks.appendStyles();
    this.loaded = true;
  }

  getLanguageCodes(): LanguageCode[] {
    return Object.keys(scratchblocks.allLanguages) as LanguageCode[];
  }

  getLanguageName(languageCode: LanguageCode): string {
    return scratchblocks.allLanguages[languageCode]?.name || languageCode;
  }

  getGreenFlagCommand(languageCode: LanguageCode): string {
    return (
      scratchblocks.allLanguages[languageCode]?.commands?.EVENT_WHENFLAGCLICKED ??
      "when green flag clicked"
    );
  }

  hasLanguage(languageCode: LanguageCode): boolean {
    return Boolean(scratchblocks.allLanguages[languageCode]);
  }

  createSvgElement(src: string, options: ScratchblocksRenderOptions): SVGElement {
    const parsed = scratchblocks.parse(src, options);

    return scratchblocks.render(parsed, {
      style: options.style,
      scale: options.scale,
      inline: options.inline,
    });
  }

  createSVGString(src: string, options: ScratchblocksRenderOptions): string {
    const view = this.createView(src, options);

    view.render();

    return view.exportSVGString();
  }

  async createPNGBlob(src: string, options: ScratchblocksRenderOptions): Promise<Blob> {
    const view = this.createView(src, options);

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

  private createView(src: string, options: ScratchblocksRenderOptions): ScratchblocksView {
    const parsed = scratchblocks.parse(src, options);

    return scratchblocks.newView(parsed, {
      style: options.style,
      scale: options.scale,
    });
  }
}

function isLocalImageURL(url: string): boolean {
  return url.startsWith("blob:") || url.startsWith("data:");
}
