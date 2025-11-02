import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations } from '@/i18n/translations';
import { useQuery } from '@tanstack/react-query';
import type { Settings } from '@shared/schema';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('English');

  // Fetch settings to get the language preference
  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  // Update language when settings are loaded
  useEffect(() => {
    if (settings?.language) {
      setLanguageState(settings.language as Language);
    }
  }, [settings]);

  // Update document direction for RTL languages
  useEffect(() => {
    const isRTL = language === 'Arabic' || language === 'Urdu';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language.toLowerCase();
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = translations[language];
  const isRTL = language === 'Arabic' || language === 'Urdu';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
