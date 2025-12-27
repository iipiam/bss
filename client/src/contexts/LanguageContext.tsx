import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations, supportedLanguages } from '@/i18n/translations';
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
  German: 'de',
  Chinese: 'zh',
  Bengali: 'bn',
  Italian: 'it',
  Hindi: 'hi',
  Urdu: 'ur',
  Spanish: 'es',
  Tagalog: 'tl'
};

const LANGUAGE_STORAGE_KEY = 'bss-language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to validate language
function isValidLanguage(lang: string): lang is Language {
  return supportedLanguages.includes(lang as Language);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasInitializedFromBackend, setHasInitializedFromBackend] = useState(false);
  
  // Initialize language from localStorage or default to English
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    // Validate stored language - if invalid, fallback to English
    if (stored && isValidLanguage(stored)) {
      return stored as Language;
    }
    // Clear invalid language from storage
    if (stored) {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    }
    return 'English';
  });

  // Only fetch settings when user is authenticated
  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
    enabled: !!user,
    retry: false,
  });

  // Sync language from backend settings ONLY on first load (not on every settings change)
  useEffect(() => {
    if (settings?.language && !hasInitializedFromBackend) {
      const backendLanguage = settings.language as Language;
      // Only update if different from current localStorage value
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (!storedLang || storedLang !== backendLanguage) {
        setLanguageState(backendLanguage);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, backendLanguage);
      }
      setHasInitializedFromBackend(true);
    }
  }, [settings, hasInitializedFromBackend]);
  
  // Reset initialization flag when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      setHasInitializedFromBackend(false);
    }
  }, [user]);

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
