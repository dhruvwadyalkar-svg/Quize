import React, { useState } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';

export const ThemeSwitcher = () => {
  const { theme, changeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div className="relative z-50">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel text-xs font-semibold hover:border-slate-500 transition-all shadow-sm"
      >
        <span>{currentThemeObj.icon}</span>
        <span className="hidden md:inline font-medium">{currentThemeObj.name}</span>
        <Palette className="w-3.5 h-3.5 opacity-70" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click dismiss */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 rounded-2xl glass-panel p-2 shadow-2xl border z-50 space-y-1"
            >
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-700/50 mb-1">
                Select Visual Theme
              </div>

              {THEMES.map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      changeTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                        : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span>{t.name}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
