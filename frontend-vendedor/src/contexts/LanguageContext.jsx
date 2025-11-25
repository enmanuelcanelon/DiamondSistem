import { createContext, useContext, useState, useEffect } from 'react';
import translations from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Obtener idioma guardado en localStorage o usar español por defecto
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'es';
  });

  // Guardar idioma en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'es' ? 'en' : 'es');
  };

  // Función de traducción
  const t = (key, defaultValue = '') => {
    const keys = key.split('.');
    let value = translations[language] || translations.es;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue || key;
      }
    }
    
    return typeof value === 'string' ? value : (defaultValue || key);
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    isSpanish: language === 'es',
    isEnglish: language === 'en',
    t // Función de traducción
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

