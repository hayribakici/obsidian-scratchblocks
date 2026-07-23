declare module "scratchblocks" {
  export interface ScratchblocksLanguage {
    name?: string;
    commands?: {
      EVENT_WHENFLAGCLICKED?: string;
    };
  }

  interface ScratchblocksDocument {
    stringify(): string;
  }

  interface ScratchblocksView {
    render(): SVGElement;
    exportSVGString(): string;
    exportPNG(callback: (url: string) => void, scale?: number): void;
  }

  interface ScratchblocksOptions {
    languages?: string[];
    style?: string;
    scale?: number;
    inline?: boolean;
  }

  interface ScratchblocksApi {
    allLanguages: Record<string, ScratchblocksLanguage | undefined>;
    appendStyles(): void;
    loadLanguages(
      languages: Record<string, ScratchblocksLanguage | undefined>
    ): void;
    newView(
      document: ScratchblocksDocument,
      options: ScratchblocksOptions
    ): ScratchblocksView;
    parse(source: string, options: ScratchblocksOptions): ScratchblocksDocument;
    render(
      document: ScratchblocksDocument,
      options: ScratchblocksOptions
    ): SVGElement;
  }

  const scratchblocks: ScratchblocksApi;

  export default scratchblocks;
}

declare module "scratchblocks/locales/all.js" {
  import type { ScratchblocksLanguage } from "scratchblocks";

  const allLanguages: Record<string, ScratchblocksLanguage | undefined>;

  export default allLanguages;
}
