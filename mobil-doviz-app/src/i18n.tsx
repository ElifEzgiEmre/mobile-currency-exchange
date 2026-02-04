import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import en from './locales/en.json';
import pl from './locales/pl.json';
import tr from './locales/tr.json';

const translations: Record<string, Record<string, unknown>> = { en, pl, tr };
export type Locale = 'en' | 'pl' | 'tr';

function get(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[k];
  }
  return typeof current === 'string' ? current : undefined;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const dict = translations[locale] || en;

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = get(dict as Record<string, unknown>, key);
      if (value === undefined) {
        value = get(en as Record<string, unknown>, key);
      }
      if (value === undefined) return key;
      if (params) {
        Object.keys(params).forEach((k) => {
          value = (value as string).replace(new RegExp(`{{${k}}}`, 'g'), String(params[k]));
        });
      }
      return value as string;
    },
    [locale, dict]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
