/**
 * i18n — internationalization
 *
 * Pattern: locale files export a flat object of keys → translations.
 * Add new locale: copy vi.js → en.js, translate values, set DEFAULT_LOCALE.
 *
 * Usage:
 *   import { t } from './i18n/index.js';
 *   t('quiz.next')  // "Câu kế →"
 *   t('quiz.scoreOf', { score: 5, total: 10 })  // "5 / 10"
 */

import { vi } from './vi.js';

const LOCALES = {
  vi,
  // en: enLocale  // future
};

const DEFAULT_LOCALE = 'vi';
const STORAGE_KEY = 'jptea-locale';

let currentLocale = DEFAULT_LOCALE;

// Init from localStorage if set
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && LOCALES[saved]) currentLocale = saved;
} catch {}

/**
 * Translate a key. Supports nested keys (e.g. "quiz.next") and {placeholder} interpolation.
 */
export function t(key, vars = {}) {
  const dict = LOCALES[currentLocale] || LOCALES[DEFAULT_LOCALE];
  const value = key.split('.').reduce((acc, k) => acc?.[k], dict);
  if (value === undefined) {
    console.warn(`[i18n] Missing translation: "${key}" (${currentLocale})`);
    return key;
  }
  return interpolate(value, vars);
}

export function setLocale(locale) {
  if (!LOCALES[locale]) {
    console.warn(`[i18n] Unknown locale: ${locale}`);
    return;
  }
  currentLocale = locale;
  try { localStorage.setItem(STORAGE_KEY, locale); } catch {}
}

export function getLocale() {
  return currentLocale;
}

export function getAvailableLocales() {
  return Object.keys(LOCALES);
}

/** Get language name for AI prompts (always English so AI understands) */
export function getLanguageName() {
  const names = { vi: 'Vietnamese', en: 'English' };
  return names[currentLocale] || 'Vietnamese';
}

function interpolate(str, vars) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}
