import type { LanguageMode } from '../types';

export type ProblemSetView = 'standard' | 'upper' | 'nativeEnglish';

export const isProblemSetView = (value: string | null): value is ProblemSetView =>
  value === 'standard' || value === 'upper' || value === 'nativeEnglish';

const normalizeLocale = (locale: string | null | undefined) => (locale || '').trim().toLowerCase();

export const getDeviceLocales = (): string[] => {
  const locales: string[] = [];

  if (typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages)) {
      locales.push(...navigator.languages);
    }
    locales.push(navigator.language);
  }

  try {
    locales.push(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    // Intl may be unavailable in limited embedded runtimes.
  }

  return Array.from(new Set(locales.map(normalizeLocale).filter(Boolean)));
};

export const isEnglishDeviceLocale = () =>
  getDeviceLocales().some((locale) => locale === 'en' || locale.startsWith('en-'));

export const getInitialLanguageMode = (storedMode: LanguageMode | null): LanguageMode =>
  storedMode || (isEnglishDeviceLocale() ? 'ENGLISH' : 'JAPANESE');

export const getInitialProblemSetView = (storedView: ProblemSetView | null): ProblemSetView =>
  storedView || (isEnglishDeviceLocale() ? 'nativeEnglish' : 'standard');
