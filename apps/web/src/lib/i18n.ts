import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import ar from '../locales/ar/common.json';
import en from '../locales/en/common.json';

export const SUPPORTED_LANGS = ['en', 'ar'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const RTL_LANGS: ReadonlySet<SupportedLang> = new Set(['ar']);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      ar: { common: ar },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'mizan.lang',
    },
  });

export function applyDirection(lang: string): void {
  const isRtl = RTL_LANGS.has(lang as SupportedLang);
  const root = document.documentElement;
  root.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  root.setAttribute('lang', lang);
}

i18n.on('languageChanged', applyDirection);

export default i18n;
