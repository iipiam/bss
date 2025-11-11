import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations } from '@/i18n/translations';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Settings } from '@shared/schema';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
  isRTL: boolean;
  isUpdating: boolean;
}

// Mapping from Language names to ISO 639-1 codes for accessibility
const languageToLocaleCode: Record<Language, string> = {
  English: 'en',
  Arabic: 'ar',
  Chinese: 'zh',
  German: 'de',
  Hindi: 'hi',
  Urdu: 'ur',
  Bengali: 'bn'
};

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
    document.documentElement.lang = languageToLocaleCode[language];
  }, [language]);

  const updateLanguageMutation = useMutation({
    mutationFn: async (newLanguage: Language) => {
      await apiRequest("PATCH", "/api/settings", { language: newLanguage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  const setLanguage = async (newLanguage: Language) => {
    const previousLanguage = language;
    setLanguageState(newLanguage);
    try {
      await updateLanguageMutation.mutateAsync(newLanguage);
    } catch (error) {
      // Rollback to previous language on error
      setLanguageState(previousLanguage);
      throw error;
    }
  };

  const t = translations[language];
  const isRTL = language === 'Arabic' || language === 'Urdu';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, isUpdating: updateLanguageMutation.isPending }}>
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
