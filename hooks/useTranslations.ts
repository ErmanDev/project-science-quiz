import { useLanguage } from '../contexts/LanguageContext';
import { resources } from '../translations';

export const useTranslations = () => {
  const { language } = useLanguage();
  
  const t = (key: string): string => {
    const langResources = resources[language]?.translation;
    if (!langResources) {
        // Fallback to English if the current language isn't found
        const fallbackResources = resources.en.translation;
        const fallbackTranslation = fallbackResources[key as keyof typeof fallbackResources];
        return fallbackTranslation || key;
    }

    const translation = langResources[key as keyof typeof langResources];
    
    // Fallback to English if a specific key is not found in the current language
    if (!translation) {
        const fallbackResources = resources.en.translation;
        const fallbackTranslation = fallbackResources[key as keyof typeof fallbackResources];
        return fallbackTranslation || key;
    }
    
    return translation;
  };

  return { t };
};
