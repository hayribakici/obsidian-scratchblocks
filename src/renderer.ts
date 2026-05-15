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
    const svg = scratchblocks.render(doc, { style });

    return this.scaleSVG(svg, scale);
  }

  private scaleSVG(svg: SVGElement, scale: number): SVGElement {
    const width = Number(svg.getAttribute("width"));
    const height = Number(svg.getAttribute("height"));

    if (!Number.isNaN(width) && !Number.isNaN(height)) {
      svg.setAttribute("width", String(width * scale));
      svg.setAttribute("height", String(height * scale));
    }

    return svg;
  }
}
