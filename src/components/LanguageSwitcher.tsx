'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', rtl: false },
  { code: 'es', name: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'pt', name: 'Português', flag: '🇵🇹', rtl: false },
  { code: 'ja', name: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'zh', name: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'he', name: 'עברית', flag: '🇮🇱', rtl: true },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', rtl: false },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳', rtl: false },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳', rtl: false },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳', rtl: false },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳', rtl: false },
  { code: 'sa', name: 'संस्कृतम्', flag: '🇮🇳', rtl: false },
];

interface LanguageSwitcherProps {
  currentLocale?: string;
  className?: string;
  onLanguageChange?: (locale: string) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  currentLocale = 'en', 
  className = '',
  onLanguageChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  const handleLanguageChange = (locale: string) => {
    if (onLanguageChange) {
      // Use the parent's changeLanguage function
      onLanguageChange(locale);
    } else {
      // Fallback to direct URL change
      const currentPath = window.location.pathname;
      const hasLanguagePrefix = /^\/[a-z]{2}(\/|$)/.test(currentPath);
      
      let newPath;
      if (hasLanguagePrefix) {
        newPath = currentPath.replace(/^\/[a-z]{2}/, `/${locale}`);
      } else {
        newPath = `/${locale}${currentPath}`;
      }
      
      window.location.href = newPath;
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-md hover:bg-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
      >
        <Globe className="w-3 h-3" />
        <span className="text-xs">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-xs">{currentLanguage.name}</span>
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  currentLocale === language.code
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-sm">{language.flag}</span>
                <span className="text-xs">{language.name}</span>
                {currentLocale === language.code && (
                  <span className="ml-auto text-blue-600 dark:text-blue-400 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSwitcher;
