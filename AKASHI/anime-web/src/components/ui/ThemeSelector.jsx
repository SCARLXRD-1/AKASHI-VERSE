import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const ACCENT_PREVIEWS = {
  purple: 'bg-[#7C3AED]',
  red: 'bg-[#DC2626]',
  blue: 'bg-[#2563EB]',
  green: 'bg-[#059669]',
  pink: 'bg-[#DB2777]',
  orange: 'bg-[#EA580C]',
};

const ACCENT_LABELS = {
  purple: 'Púrpura',
  red: 'Samurái',
  blue: 'Océano',
  green: 'Esmeralda',
  pink: 'Sakura',
  orange: 'Ninja',
};

const ThemeSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark, toggleTheme, accent, changeAccent, availableAccents } = useTheme();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
          isOpen ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:text-white hover:bg-white/5'
        }`}
        title="Personalizar Apariencia"
      >
        <Palette size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-3 w-64 bg-background-secondary/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/80 p-5 z-[200]"
          >
            {/* Mode toggle */}
            <div className="mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-3">Modo</h3>
              <div className="flex bg-background-main rounded-2xl p-1 border border-white/5">
                <button
                  onClick={() => isDark && toggleTheme()}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    isDark ? 'text-text-secondary hover:text-white' : 'bg-white shadow-sm text-black'
                  }`}
                >
                  <Sun size={14} /> Claro
                </button>
                <button
                  onClick={() => !isDark && toggleTheme()}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    isDark ? 'bg-white/10 text-white shadow-sm' : 'text-text-secondary hover:text-white'
                  }`}
                >
                  <Moon size={14} /> Oscuro
                </button>
              </div>
            </div>

            {/* Accent toggle */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-3">Color de Acento</h3>
              <div className="grid grid-cols-3 gap-2">
                {availableAccents.map((acc) => (
                  <button
                    key={acc}
                    onClick={() => changeAccent(acc)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                      accent === acc 
                        ? 'border-white/20 bg-white/5 shadow-inner' 
                        : 'border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ACCENT_PREVIEWS[acc]}`}>
                      {accent === acc && <Check size={16} className="text-white drop-shadow-md" />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                      accent === acc ? 'text-white' : 'text-text-secondary'
                    }`}>
                      {ACCENT_LABELS[acc]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSelector;
