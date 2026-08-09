import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = [
  { id: 'midnight', name: 'Apple Midnight', icon: '🌌', bgClass: 'bg-black', accent: '#0071e3' },
  { id: 'titanium', name: 'Titanium Light', icon: '❄️', bgClass: 'bg-[#f5f5f7]', accent: '#0071e3' },
  { id: 'cyberpunk', name: 'Neon Quartz', icon: '🔮', bgClass: 'bg-[#090514]', accent: '#a855f7' },
  { id: 'emerald', name: 'Obsidian Emerald', icon: '🌿', bgClass: 'bg-[#02100b]', accent: '#10b981' },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('quiz_app_theme') || 'midnight');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'titanium') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('quiz_app_theme', theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
