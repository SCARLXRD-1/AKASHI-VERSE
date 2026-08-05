import { createContext, useContext, createElement, useEffect, useRef, useState } from 'react';

const THEME_STORAGE_KEY = 'zenkai-theme';
const ACCENT_STORAGE_KEY = 'zenkai-accent';
const THEMES = new Set(['dark', 'light']);
const ACCENTS = new Set(['purple', 'red', 'blue', 'green', 'pink', 'orange']);

const getSystemTheme = () => {
  if (typeof globalThis === 'undefined' || !globalThis.matchMedia) return 'dark';
  return globalThis.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

const getSavedTheme = () => {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) return null;
  const savedTheme = globalThis.localStorage.getItem(THEME_STORAGE_KEY);
  return THEMES.has(savedTheme) ? savedTheme : null;
};

export const getInitialTheme = () => getSavedTheme() || getSystemTheme();

export const getInitialAccent = () => {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) return 'purple';
  const savedAccent = globalThis.localStorage.getItem(ACCENT_STORAGE_KEY);
  return ACCENTS.has(savedAccent) ? savedAccent : 'purple';
};

export const applyTheme = (theme, accent = null) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  if (accent) document.documentElement.dataset.accent = accent;
  document.documentElement.style.colorScheme = theme;
};

export const applyStoredTheme = () => {
  applyTheme(getInitialTheme(), getInitialAccent());
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [accent, setAccent] = useState(getInitialAccent);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    applyTheme(theme, accent);
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, theme);
    globalThis.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  }, [theme, accent]);

  const toggleTheme = () => {
    if (isTransitioningRef.current) return;

    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    isTransitioningRef.current = true;
    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.finished.finally(() => {
      isTransitioningRef.current = false;
    });
  };

  const changeAccent = (newAccent) => {
    if (ACCENTS.has(newAccent)) {
      setAccent(newAccent);
    }
  };

  return createElement(
    ThemeContext.Provider,
    {
      value: {
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        accent,
        changeAccent,
        availableAccents: Array.from(ACCENTS)
      }
    },
    children
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

import PropTypes from 'prop-types';
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired
};
