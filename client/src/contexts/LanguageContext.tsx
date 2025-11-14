import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations } from '@/i18n/translations';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import type { Settings } from '@shared/schema';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
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

const LANGUAGE_STORAGE_KEY = 'bss-language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Initialize language from localStorage or default to English
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (stored as Language) || 'English';
  });

  // Only fetch settings when user is authenticated
  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
    enabled: !!user,
    retry: false,
  });

  // Sync language from backend settings when user logs in
  useEffect(() => {
    if (settings?.language) {
      const backendLanguage = settings.language as Language;
      setLanguageState(backendLanguage);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, backendLanguage);
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

  const setLanguage = (newLanguage: Language) => {
    const previousLanguage = language;
    
    // Always update localStorage immediately
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    setLanguageState(newLanguage);
    
    // Only save to backend if authenticated
    if (user) {
      updateLanguageMutation.mutate(newLanguage, {
        onError: () => {
          // Rollback on error
          localStorage.setItem(LANGUAGE_STORAGE_KEY, previousLanguage);
          setLanguageState(previousLanguage);
        }
      });
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
