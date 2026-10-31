import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Preferensi tema: 'dark' | 'light' | 'auto'
  const [themePreference, setThemePreferenceState] = useState(() => {
    return localStorage.getItem('decko_theme_pref') || 'auto';
  });

  const [effectiveTheme, setEffectiveTheme] = useState('dark');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const resolveTheme = () => {
      if (themePreference === 'auto') {
        const isHardwareDark = mediaQuery.matches;
        const current = isHardwareDark ? 'dark' : 'light';
        setEffectiveTheme(current);
        document.documentElement.setAttribute('data-theme', current);
      } else {
        setEffectiveTheme(themePreference);
        document.documentElement.setAttribute('data-theme', themePreference);
      }
    };

    resolveTheme();

    const handleChange = () => {
      if (themePreference === 'auto') {
        resolveTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference]);

  const setThemePreference = (pref) => {
    setThemePreferenceState(pref);
    localStorage.setItem('decko_theme_pref', pref);
  };

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
