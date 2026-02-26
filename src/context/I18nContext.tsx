import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Locale, messages } from '../i18n/messages';

type TranslateParams = Record<string, string | number>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
}

const STORAGE_KEY = 'apas_locale';
const DEFAULT_LOCALE: Locale = 'fr';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const isLocale = (value: string | null): value is Locale => {
  return value === 'fr' || value === 'en';
};

const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
};

const interpolate = (template: string, params?: TranslateParams): string => {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
    const value = params[paramKey];
    return value === undefined ? '' : String(value);
  });
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const t = useMemo(() => {
    return (key: string, params?: TranslateParams) => {
      const localized = messages[locale][key] ?? messages.en[key] ?? key;
      return interpolate(localized, params);
    };
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return context;
}
