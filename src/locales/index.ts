/**
 * Internationalization (i18n) module for ESPHome Dashboard
 * Provides a simple, lightweight translation system
 */

import { en, TranslationKeys } from "./en";
import { tr } from "./tr";

// Available locales
export const LOCALES = {
  en: { name: "English", nativeName: "English", translations: en },
  tr: { name: "Turkish", nativeName: "Turkce", translations: tr },
} as const;

export type LocaleCode = keyof typeof LOCALES;

// Storage key for persisting language preference
const STORAGE_KEY = "esphome-dashboard-locale";

// Current locale state
let currentLocale: LocaleCode = "en";

// Event listeners for locale changes
type LocaleChangeListener = (locale: LocaleCode) => void;
const listeners: Set<LocaleChangeListener> = new Set();

/**
 * Get the user's preferred locale from browser settings
 */
function getBrowserLocale(): LocaleCode {
  const browserLang = navigator.language.split("-")[0];
  if (browserLang in LOCALES) {
    return browserLang as LocaleCode;
  }
  return "en";
}

/**
 * Initialize the i18n system
 * Loads saved preference or detects from browser
 */
export function initLocale(): LocaleCode {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved in LOCALES) {
    currentLocale = saved as LocaleCode;
  } else {
    currentLocale = getBrowserLocale();
  }
  return currentLocale;
}

/**
 * Get the current locale code
 */
export function getLocale(): LocaleCode {
  return currentLocale;
}

/**
 * Set the current locale and persist it
 */
export function setLocale(locale: LocaleCode): void {
  if (!(locale in LOCALES)) {
    console.warn(`Unknown locale: ${locale}, falling back to 'en'`);
    locale = "en";
  }
  currentLocale = locale;
  localStorage.setItem(STORAGE_KEY, locale);

  // Notify all listeners
  listeners.forEach((listener) => listener(locale));

  // Dispatch custom event for components that don't use listeners
  window.dispatchEvent(
    new CustomEvent("locale-changed", { detail: { locale } })
  );
}

/**
 * Subscribe to locale changes
 */
export function onLocaleChange(listener: LocaleChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get translations for the current locale
 */
function getTranslations(): TranslationKeys {
  return LOCALES[currentLocale].translations as TranslationKeys;
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof result === "string" ? result : undefined;
}

/**
 * Translate a key with optional interpolation
 * @param key - The translation key (supports dot notation for nested keys)
 * @param params - Optional parameters for interpolation
 * @returns The translated string
 *
 * @example
 * t('save') // Returns "Save" or "Kaydet"
 * t('editor.saved', { fileName: 'test.yaml' }) // Returns "Saved test.yaml"
 */
export function t(
  key: string,
  params?: Record<string, string | number>
): string {
  const translations = getTranslations();
  let value = getNestedValue(translations, key);

  // Fallback to English if translation not found
  if (value === undefined) {
    value = getNestedValue(en, key);
  }

  // Return key if no translation found
  if (value === undefined) {
    console.warn(`Missing translation for key: ${key}`);
    return key;
  }

  // Interpolate parameters
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      value = value!.replace(
        new RegExp(`\\{${paramKey}\\}`, "g"),
        String(paramValue)
      );
    });
  }

  return value;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): Array<{
  code: LocaleCode;
  name: string;
  nativeName: string;
}> {
  return Object.entries(LOCALES).map(([code, data]) => ({
    code: code as LocaleCode,
    name: data.name,
    nativeName: data.nativeName,
  }));
}

// Initialize locale on module load
initLocale();
