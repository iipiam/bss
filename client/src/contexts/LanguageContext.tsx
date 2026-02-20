import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations, supportedLanguages } from '@/i18n/translations';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
  isUpdating: boolean;
}

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

function isValidLanguage(lang: string): lang is Language {
  return supportedLanguages.includes(lang as Language);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasInitializedFromUser, setHasInitializedFromUser] = useState(false);
  
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isValidLanguage(stored)) {
      return stored as Language;
    }
    if (stored) {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    }
    return 'English';
  });

  // Sync language from user profile on first load
  useEffect(() => {
    if (user && !hasInitializedFromUser) {
      const userLanguage = (user as any).language as string;
      if (userLanguage && isValidLanguage(userLanguage)) {
        const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (!storedLang || storedLang !== userLanguage) {
          setLanguageState(userLanguage as Language);
          localStorage.setItem(LANGUAGE_STORAGE_KEY, userLanguage);
        }
      }
      setHasInitializedFromUser(true);
    }
  }, [user, hasInitializedFromUser]);
  
  // Reset initialization flag when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      setHasInitializedFromUser(false);
    }
  }, [user]);

  // Update document direction for RTL languages
  useEffect(() => {
    const isRTL = language === 'Arabic' || language === 'Urdu';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = languageToLocaleCode[language];
  }, [language]);

  // Save language to user profile (works for all accounts, no settings permission needed)
  const updateLanguageMutation = useMutation({
    mutationFn: async (newLanguage: Language) => {
      await apiRequest("PATCH", "/api/auth/me", { language: newLanguage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const setLanguage = (newLanguage: Language) => {
    const previousLanguage = language;
    
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    setLanguageState(newLanguage);
    
    if (user) {
      updateLanguageMutation.mutate(newLanguage, {
        onError: () => {
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
