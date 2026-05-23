import scratchblocks from "scratchblocks";
import allLanguages from "scratchblocks/locales/all.js";
import type { LanguageCode, ScratchblocksStyle } from "./types";

// Helper class that renders the scratch code into svg
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
    const doc = scratchblocks.parse(src, { languages });
    const svg = scratchblocks.render(doc, { style, scale });

    return svg;
  }

  getSVGString(
    src: string,
    languages: LanguageCode[],
    style: ScratchblocksStyle,
    scale: number
  ): string {
    const doc = scratchblocks.parse(src, { languages });
    const view = scratchblocks.newView(doc, { style, scale });

    view.render();

    return view.exportSVGString();
  }
}
