module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ru'],
    localeDetection: true,
  },
  fallbackLng: 'en',
  debug: process.env.NODE_ENV === 'development',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
};
