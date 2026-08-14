import { Decoration, ViewPlugin, WidgetType } from "@codemirror/view";
import type { EditorState, Range, StateField } from "@codemirror/state";
import type { DecorationSet, EditorView, ViewUpdate } from "@codemirror/view";

interface BacktickedText {
  lineNumber: number;
  from: number;
  to: number;
  text: string;
}

export function createBacktickedTextExtension(
  getReplacementText: (text: string) => string | null,
  renderReplacement: (text: string, targetDocument: Document) => HTMLElement,
  livePreviewField: StateField<boolean>
) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      fencedLines: Set<number>;
      livePreviewField: StateField<boolean>;

      constructor(view: EditorView) {
        this.livePreviewField = livePreviewField;
        this.fencedLines = getFencedCodeBlockLines(view);
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.selectionSet ||
          update.viewportChanged ||
          this.isLivePreview(update.startState) !==
            this.isLivePreview(update.state)
        ) {
          if (update.docChanged) {
            this.fencedLines = getFencedCodeBlockLines(update.view);
          }

          this.decorations = this.buildDecorations(update.view);
        }
      }

      private buildDecorations(view: EditorView): DecorationSet {
        if (!this.isLivePreview(view.state)) {
          return Decoration.none;
        }

        return buildBacktickedTextDecorations(
          view,
          this.fencedLines,
          getReplacementText,
          renderReplacement
        );
      }

      private isLivePreview(state: EditorState): boolean {
        return state.field(this.livePreviewField, false) ?? false;
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    }
  );
}

export function findBacktickedText(
  lineText: string,
  lineNumber = 1
): BacktickedText[] {
  if (lineText.trim().startsWith("```")) {
    return [];
  }

  const matches: BacktickedText[] = [];
  const inlineCode = /(^|[^`])`([^`\n]+)`(?!`)/g;
  let match: RegExpExecArray | null;

  while ((match = inlineCode.exec(lineText)) !== null) {
    const openingBacktick = match.index + match[1].length;
    const closingBacktick = openingBacktick + match[2].length + 1;

    matches.push({
      lineNumber,
      from: openingBacktick,
      to: closingBacktick + 1,
      text: match[2],
    });
  }

  return matches;
}

function buildBacktickedTextDecorations(
  view: EditorView,
  fencedLines: Set<number>,
  getReplacementText: (text: string) => string | null,
  renderReplacement: (text: string, targetDocument: Document) => HTMLElement
): DecorationSet {
  const ranges: Range<Decoration>[] = [];

  for (const visibleRange of view.visibleRanges) {
    let line = view.state.doc.lineAt(visibleRange.from);

    while (line.from <= visibleRange.to) {
      if (!fencedLines.has(line.number)) {
        for (const match of findBacktickedText(line.text, line.number)) {
          const replacementText = getReplacementText(match.text);

          if (!replacementText) {
            continue;
          }

          const from = line.from + match.from;
          const to = line.from + match.to;

          if (selectionTouchesRange(view, from, to)) {
            continue;
          }

          ranges.push(
            Decoration.replace({
              widget: new BacktickedTextWidget(
                replacementText,
                renderReplacement
              ),
            }).range(from, to)
          );
        }
      }

      if (line.to >= view.state.doc.length || line.to >= visibleRange.to) {
        break;
      }

      line = view.state.doc.line(line.number + 1);
    }
  }

  return Decoration.set(ranges, true);
}

function selectionTouchesRange(view: EditorView, from: number, to: number) {
  return view.state.selection.ranges.some((range) => {
    if (range.empty) {
      return range.from >= from && range.from <= to;
    }

    return range.from < to && range.to > from;
  });
}

function getFencedCodeBlockLines(view: EditorView): Set<number> {
  const fencedLines = new Set<number>();
  let fenceMarker = "";

  for (let lineNumber = 1; lineNumber <= view.state.doc.lines; lineNumber++) {
    const line = view.state.doc.line(lineNumber).text;

    if (!fenceMarker) {
      fenceMarker = getFenceMarker(line);
      continue;
    }

    if (isClosingFence(line, fenceMarker)) {
      fenceMarker = "";
      continue;
    }

    fencedLines.add(lineNumber);
  }

  return fencedLines;
}

function getFenceMarker(line: string): string {
  const trimmed = line.trim();

  if (trimmed.startsWith("```")) {
    return "`";
  }

  if (trimmed.startsWith("~~~")) {
    return "~";
  }

  return "";
}

function isClosingFence(line: string, fenceMarker: string): boolean {
  const trimmed = line.trim();

  if (fenceMarker === "`") {
    return trimmed === "```";
  }

  if (fenceMarker === "~") {
    return trimmed === "~~~";
  }

  return false;
}

class BacktickedTextWidget extends WidgetType {
  constructor(
    private readonly text: string,
    private readonly renderReplacement: (
      text: string,
      targetDocument: Document
    ) => HTMLElement
  ) {
    super();
  }

  eq(other: BacktickedTextWidget) {
    return this.text === other.text;
  }

  toDOM(view: EditorView) {
    return this.renderReplacement(this.text, view.dom.ownerDocument);
  }
}
