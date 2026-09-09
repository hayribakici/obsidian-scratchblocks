## Release Plan

### ~~0.0.21: Declarative settings~~ Postponed

Adopt Obsidian’s declarative settings API.

- Add `getSettingDefinitions()`
- Make settings searchable in Obsidian 1.13+

### 0.0.22: CSS and sizing

Improve the appearance of inline Scratchblocks.

- Make inline blocks follow the surrounding text size
- Keep styling consistent across themes and font sizes

### 0.0.23: Rendering polish

Improve the fallback behavior when rendering fails.

- Keep language, style, scale, sizing, and error handling consistent across reading view, live preview, and exports
- Show a clear rendering error without adding a second syntax parser

### 0.0.24: Code folding

- Fold Scratchblocks fences in the editor

## Future Ideas

### Scratch project integration

- Read `.sb3` projects through [scratch-project-ts](https://github.com/hayribakici/scratch-project-ts)
- Show scripts/code per sprite in a tabbed view inside Obsidian
