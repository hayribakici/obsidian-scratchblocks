import { getLanguage } from "obsidian";

import { i18n, isLocale } from "./generated/i18n-util";
import { loadAllLocales } from "./generated/i18n-util.sync";

import type {
  Locales,
  TranslationFunctions,
} from "./generated/i18n-types";

loadAllLocales();


export const L: TranslationFunctions = i18n()[getPluginLocale()];

function getPluginLocale(): Locales {
  const language = getLanguage().toLowerCase();
  const primaryLanguage = language.split("-")[0].split("_")[0];

  if (isLocale(language)) return language;
  if (isLocale(primaryLanguage)) return primaryLanguage;

  return "en";
}
