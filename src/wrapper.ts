import scratchblocks from "scratchblocks";
import allLanguages from "scratchblocks/locales/all.js";
import type { LanguageCode, ScratchblocksStyle } from "./utils/types";

export interface RenderOptions {
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
    return Object.keys(scratchblocks.allLanguages);
  }

  getLanguageName(languageCode: LanguageCode): string {
    return scratchblocks.allLanguages[languageCode]?.name ?? languageCode;
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

  createSVGElement(src: string, options: RenderOptions): SVGElement {
    const parsed = scratchblocks.parse(src, options);

    return scratchblocks.render(parsed, {
      style: options.style,
      scale: options.scale,
      inline: options.inline,
    });
  }

  createSVGString(src: string, options: RenderOptions): string {
    const view = this.createView(src, options);

    view.render();

    return view.exportSVGString();
  }

  async createPNGBlob(src: string, options: RenderOptions): Promise<Blob> {
    const view = this.createView(src, options);

    view.render();

    return new Promise((resolve, reject) => {
      view.exportPNG((url: string) => {
        void getLocalImageBlob(url)
          .then(resolve)
          .catch((error: unknown) => {
            reject(
              error instanceof Error
                ? error
                : new Error(`Scratchblocks PNG export failed: ${String(error)}`)
            );
          })
          .finally(() => {
            if (url.startsWith("blob:")) {
              URL.revokeObjectURL(url);
            }
          });
      });
    });
  }

  private createView(src: string, options: RenderOptions): ScratchblocksView {
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

function getLocalImageBlob(url: string): Promise<Blob> {
  if (!isLocalImageURL(url)) {
    return Promise.reject(
      new Error("Refusing to read a non-local Scratchblocks image URL")
    );
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("GET", url);
    request.responseType = "blob";
    request.addEventListener("load", () => {
      if (request.status === 0 || (request.status >= 200 && request.status < 300)) {
        const response: unknown = request.response;

        if (response instanceof Blob) {
          resolve(response);
          return;
        }

        reject(new Error("Could not read Scratchblocks image blob"));
        return;
      }

      reject(
        new Error(
          `Could not read Scratchblocks image URL: ${String(request.status)}`
        )
      );
    });
    request.addEventListener("error", () => {
      reject(new Error("Could not read Scratchblocks image URL"));
    });
    request.send();
  });
}
