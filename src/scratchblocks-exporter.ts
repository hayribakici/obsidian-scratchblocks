import { Notice, TFile } from "obsidian";

import {
  getAllScratchblocksSourcesFromText,
} from "./commands";
import { formatError } from "./utils";

import type { Vault } from "obsidian";
import type { ScratchblocksEngine, ScratchblocksRenderOptions } from "./engine";
import type {
  LanguageCode,
  ScratchblocksPNGExportPath,
  ScratchblocksSettings,
} from "./types";

export const PNG_MIME_TYPE = "image/png";
export const SVG_MIME_TYPE = "image/svg+xml;charset=utf-8";

const FALLBACK_LANGUAGE = "en" as LanguageCode;
const INLINE_SCALE = 0.4;

export interface ExportOptions {
  firstLine: string;
  filenameTemplate: string;
  pngBlob: () => Promise<Blob>;
  svgBlob: () => Blob;
  exportPath?: ScratchblocksPNGExportPath;
  sourcePath?: string;
  vault?: Vault;
}

export class ScratchblocksExporter {
  constructor(
    private readonly vault: Vault,
    private readonly engine: ScratchblocksEngine,
    private readonly getSettings: () => ScratchblocksSettings
  ) { }

  async copyPNG(src: string) {
    try {
      await copyPNGBlobToClipboard(await this.engine.getPNGBlob(src, this.getRenderOptions()));
    } catch (error) {
      new Notice(`Scratchblocks PNG copy failed: ${formatError(error)}`);
    }
  }

  async exportSVG(src: string, sourcePath?: string) {
    try {
      var options = this.getExportOptions(src, sourcePath);
      await exportBlob(options.svgBlob(), options, "svg");
    } catch (error) {
      new Notice(`Scratchblocks SVG export failed: ${formatError(error)}`);
    }
  }

  async exportPNG(src: string, sourcePath?: string) {
    try {
      await this.exportScratchblocksPNG(this.getExportOptions(src, sourcePath));
    } catch (error) {
      new Notice(`Scratchblocks PNG export failed: ${formatError(error)}`);
    }
  }

  async exportAllPNG(sources: string[], sourcePath?: string) {
    try {
      var options = sources.map((src) => this.getExportOptions(src, sourcePath));
      for (const option of options) {
        await this.exportScratchblocksPNG(option);
      }
    } catch (error) {
      new Notice(`Scratchblocks PNG export failed: ${formatError(error)}`);
    }
  }

  async exportAllPNGFromFile(sourcePath: string) {
    const file = this.vault.getAbstractFileByPath(sourcePath);

    if (!(file instanceof TFile)) {
      return;
    }

    const markdown = await this.vault.cachedRead(file);
    const sources = getAllScratchblocksSourcesFromText(markdown);

    if (sources.length) {
      await this.exportAllPNG(sources, sourcePath);
    }
  }

  private async exportScratchblocksPNG(options: ExportOptions) {
    const blob = await options.pngBlob();

    await exportBlob(blob, options, "png");
  }

  getExportOptions(src: string, sourcePath?: string): ExportOptions {
    const settings = this.getSettings();

    return {
      exportPath: settings.pngExportPath,
      filenameTemplate: settings.pngFilenameTemplate,
      firstLine: getFirstLine(src),
      pngBlob: () => this.engine.getPNGBlob(src, this.getRenderOptions()),
      svgBlob: () =>
        new Blob([this.engine.getSVGString(src, this.getRenderOptions())], {
          type: SVG_MIME_TYPE,
        }),
      sourcePath,
      vault: this.vault,
    };
  }

  getRenderOptions(inline = false): ScratchblocksRenderOptions {
    const settings = this.getSettings();

    return {
      languages: this.getRenderLanguages(),
      style: settings.style,
      scale: inline ? INLINE_SCALE : settings.scale,
      inline,
    };
  }

  private getRenderLanguages(): LanguageCode[] {
    const languageCode = this.getSettings().languageCode;

    if (languageCode === FALLBACK_LANGUAGE) {
      return [FALLBACK_LANGUAGE];
    }

    return [languageCode, FALLBACK_LANGUAGE];
  }
}

export async function copyPNGBlobToClipboard(blob: Blob) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("Copying PNG images to the clipboard is not supported");
  }

  const pngBlob =
    blob.type === PNG_MIME_TYPE
      ? blob
      : new Blob([blob], {
        type: PNG_MIME_TYPE,
      });

  await navigator.clipboard.write([
    new ClipboardItem({
      [PNG_MIME_TYPE]: pngBlob,
    }),
  ]);
}



function getFirstLine(src: string): string {
  return (
    src
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || ""
  );
}

function getExportFilename(
  firstLine: string,
  template: string,
  extension: "png" | "svg"
): string {
  const filename = (template || "scratchblocks_{firstLine}")
    .replaceAll("{firstLine}", firstLine || "block")
    .replaceAll("{datetime}", getFilenameDateTime());
  const sanitized = sanitizeFilenamePart(filename) || "scratchblocks";

  return `${sanitized}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function saveBlobToSourceFolder(
  blob: Blob,
  filename: string,
  vault: Vault,
  sourcePath: string
) {
  const parentPath = getParentPath(sourcePath);
  const targetPath = getUniqueVaultPath(
    vault,
    normalizeVaultPath(parentPath ? `${parentPath}/${filename}` : filename)
  );

  await vault.createBinary(targetPath, await blob.arrayBuffer());
}

async function exportBlob(
  blob: Blob,
  options: ExportOptions,
  extension: "png" | "svg"
) {
  const filename = getExportFilename(
    options.firstLine,
    options.filenameTemplate,
    extension
  );

  if (
    options.exportPath === "current" &&
    options.vault &&
    options.sourcePath
  ) {
    await saveBlobToSourceFolder(
      blob,
      filename,
      options.vault,
      options.sourcePath
    );
    return;
  }

  downloadBlob(blob, filename);
}

function getParentPath(path: string): string {
  const lastSlash = path.lastIndexOf("/");

  return lastSlash === -1 ? "" : path.slice(0, lastSlash);
}

function normalizeVaultPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

function getUniqueVaultPath(vault: Vault, path: string): string {
  if (!vault.getAbstractFileByPath(path)) {
    return path;
  }

  const extensionStart = path.lastIndexOf(".");
  const base = extensionStart === -1 ? path : path.slice(0, extensionStart);
  const extension = extensionStart === -1 ? "" : path.slice(extensionStart);
  let index = 1;
  let candidate = `${base}-${index}${extension}`;

  while (vault.getAbstractFileByPath(candidate)) {
    index += 1;
    candidate = `${base}-${index}${extension}`;
  }

  return candidate;
}

function getFilenameDateTime(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
    ].join("-") +
    "_" +
    [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join(
      "-"
    )
  );
}

function sanitizeFilenamePart(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}
