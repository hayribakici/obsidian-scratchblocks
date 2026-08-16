import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mjs", "manifest.json"],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".json"],
      },
    },
  },
  ...obsidianmd.configs.recommended,
  {
    rules: {
      "depend/ban-dependencies": ["warn", { allowed: ["builtin-modules"] }],
    },
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      "obsidianmd/no-nodejs-modules": "off",
      "obsidianmd/rule-custom-message": "off",
    },
  },
  globalIgnores([
    "node_modules",
    "dist",
    "esbuild.config.mjs",
    "eslint.config.mjs",
    "src/i18n/generated/formatters.ts",
    "src/i18n/generated/i18n-types.ts",
    "src/i18n/generated/i18n-util*.ts",
    "version-bump.mjs",
    "versions.json",
    "main.js",
  ]),
]);
