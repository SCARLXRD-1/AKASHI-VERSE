import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const TV_KEYWORDS = ['tv', 'bravia', 'webos', 'tizen', 'netcast', 'smart-tv', 'smarttv', 'appletv', 'googletv', 'androidtv', 'vidaa', 'hisense', 'roku'];

const isTVDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  const hasTVKeyword = TV_KEYWORDS.some(k => ua.includes(k));
  const hasLargeScreen = window.screen?.availWidth >= 1920 && !navigator.maxTouchPoints;
  const hasNoTouch = !('ontouchstart' in window) && navigator.maxTouchPoints <= 1;
  const isTVWidth = window.innerWidth >= 1400 && window.innerWidth <= 5000;
  return hasTVKeyword || (hasLargeScreen && hasNoTouch && isTVWidth && !window.matchMedia('(pointer: fine)').matches);
};

const TVContext = createContext({ isTV: false });

export const TVProvider = ({ children }) => {
  const [isTV] = useState(() => {
    const tv = isTVDevice();
    if (tv && typeof document !== 'undefined') {
      document.documentElement.dataset.tv = 'true';
    }
    return tv;
  });

  return (
    <TVContext.Provider value={{ isTV }}>
      {children}
    </TVContext.Provider>
  );
};

export const useTV = () => useContext(TVContext);

export function useTVNavigation({ selector = 'button, a, [tabindex]:not([tabindex="-1"])', onEnter } = {}) {
  const { isTV } = useTV();

  const getFocusable = useCallback(() => {
    return [...document.querySelectorAll(selector)].filter(
      el => el.offsetParent !== null && !el.disabled
    );
  }, [selector]);

  useEffect(() => {
    if (!isTV) return;

    const handleKeyDown = (e) => {
      const currentFocus = document.activeElement;
      const items = getFocusable();
      const currentIdx = items.indexOf(currentFocus);

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = currentIdx < items.length - 1 ? currentIdx + 1 : 0;
        items[next]?.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = currentIdx > 0 ? currentIdx - 1 : items.length - 1;
        items[prev]?.focus();
      } else if (e.key === 'Enter') {
        if (onEnter && currentFocus) {
          e.preventDefault();
          onEnter(currentFocus);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTV, getFocusable, onEnter]);
}
