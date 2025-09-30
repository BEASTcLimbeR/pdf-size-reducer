'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface TranslationData {
  [key: string]: any;
}

interface UseTranslationReturn {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  changeLanguage: (locale: string) => void;
  isLoading: boolean;
  dir: string;
  isRTL: boolean;
}

export const useTranslation = (): UseTranslationReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(true);

  // Get locale from URL query parameter
  useEffect(() => {
    const validLocales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ru', 'ar', 'he', 'hi', 'ta', 'te', 'bn', 'gu', 'mr', 'sa'];
    
    // Check URL search params
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && validLocales.includes(langParam)) {
      setLocale(langParam);
    } else {
      setLocale('en');
    }
  }, [pathname]);

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/locales/${locale}/common.json`);
        if (response.ok) {
          const data = await response.json();
          setTranslations(data);
        } else {
          // Fallback to English if translation not found
          const fallbackResponse = await fetch('/locales/en/common.json');
          const fallbackData = await fallbackResponse.json();
          setTranslations(fallbackData);
        }
      } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to English
        const fallbackResponse = await fetch('/locales/en/common.json');
        const fallbackData = await fallbackResponse.json();
        setTranslations(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [locale]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to key if translation not found
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters in translation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, param: string) => {
        return params[param]?.toString() || match;
      });
    }

    return value;
  };

  const changeLanguage = (newLocale: string) => {
    // Use query parameter approach to avoid 404 errors
    const currentPath = pathname;
    const newUrl = `${currentPath}?lang=${newLocale}`;
    window.location.href = newUrl;
  };

  // RTL support
  const rtlLocales = ['ar', 'he'];
  const dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';
  const isRTL = dir === 'rtl';

  return {
    t,
    locale,
    changeLanguage,
    isLoading,
    dir,
    isRTL,
  };
};
