import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Loader2, Tv, Film, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { animeService, proxyImage } from '../../services/animeService';
import PropTypes from 'prop-types';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='60' viewBox='0 0 40 60'%3E%3Crect width='40' height='60' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff20' font-size='16' font-family='sans-serif'%3E?%3C/text%3E%3C/svg%3E";

const TYPE_ICONS = {
  'tv': Tv,
  'movie': Film,
  'ova': Radio,
};

const SearchDropdown = ({ query, isOpen, onClose, inputRef }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setActiveIdx(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await animeService.searchAnime(query, { limit: 6 });
        setResults(data.slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Navigate to result
  const handleSelect = useCallback((anime) => {
    const slug = (anime.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/anime/${slug}?url=${encodeURIComponent(anime.url)}`);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((prev) => Math.min(prev + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((prev) => Math.max(prev - 1, -1));
      }
      if (e.key === 'Enter' && activeIdx >= 0 && results[activeIdx]) {
        e.preventDefault();
        handleSelect(results[activeIdx]);
      }
    };

    const input = inputRef?.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
      return () => input.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, activeIdx, results, handleSelect, onClose, inputRef]);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef?.current && !inputRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, inputRef]);

  const showDropdown = isOpen && query && query.trim().length >= 2;

  return (
    <AnimatePresence>
      {showDropdown && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-full left-0 right-0 mt-2 bg-background-secondary/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-[200]"
        >
          {/* Loading state */}
          {loading && (
            <div className="flex items-center gap-3 px-5 py-4">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-xs font-bold text-text-secondary">Buscando en el universo...</span>
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <div className="py-2">
              <p className="px-5 py-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                {results.length} resultado{results.length === 1 ? '' : 's'}
              </p>
              {results.map((anime, i) => {
                const TypeIcon = TYPE_ICONS[anime.type?.toLowerCase()] || Tv;
                return (
                  <button
                    type="button"
                    key={anime.url || i}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelect(anime);
                    }}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-all ${
                      activeIdx === i
                        ? 'bg-primary/10 border-l-2 border-primary'
                        : 'border-l-2 border-transparent hover:bg-white/5'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-background-main shrink-0 border border-white/5">
                      <img
                        src={proxyImage(anime.image) || IMG_FALLBACK}
                        alt=""
                        onError={(e) => { e.target.src = IMG_FALLBACK; }}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black truncate transition-colors ${
                        activeIdx === i ? 'text-primary' : 'text-white'
                      }`}>
                        {anime.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <TypeIcon size={10} className="text-text-secondary" />
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          {[anime.type, anime.year].filter(Boolean).join(' • ')}
                        </span>
                        {anime.score && Number.parseFloat(anime.score) > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-accent">
                            <Star size={8} className="fill-accent" />
                            {anime.score}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    {anime.status && (
                      <span className={`shrink-0 text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                        anime.status === 'on_air' || anime.status === '1'
                          ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                          : 'bg-white/5 text-text-secondary border border-white/5'
                      }`}>
                        {anime.status === 'on_air' || anime.status === '1' ? 'En emisión' : 'Finalizado'}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Footer hint */}
              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-wider">
                  ↑↓ navegar • Enter seleccionar • Esc cerrar
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/search?q=${encodeURIComponent(query)}`);
                    onClose();
                  }}
                  className="text-[9px] font-black text-primary uppercase tracking-wider hover:underline"
                >
                  Ver todos →
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="flex flex-col items-center gap-2 px-5 py-6 text-center">
              <Search size={20} className="text-white/10" />
              <p className="text-xs font-bold text-text-secondary">No se encontraron resultados para "{query}"</p>
              <p className="text-[10px] text-white/20">Intenta con otro término</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};



SearchDropdown.propTypes = {
  query: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  inputRef: PropTypes.shape({
    current: PropTypes.instanceOf(Element)
  })
};

export default SearchDropdown;
