import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { animeService } from '../services/animeService';
import AnimeCard from '../components/cards/AnimeCard';
import { AnimeCardSkeleton } from '../components/ui/Skeleton';
import { Compass, Filter, Sparkles, ChevronLeft, ChevronRight, ArrowUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

const FilterButton = ({ label, options, activeValue, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeLabel = options.find(o => o.value === activeValue)?.label || label;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-xs transition-all border ${
          activeValue ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-background-secondary border-white/5 text-text-secondary hover:text-white hover:border-white/10'
        }`}
      >
        <span className="uppercase tracking-widest">{activeLabel}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <button 
              type="button"
              className="fixed inset-0 z-40 bg-transparent border-none cursor-default" 
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar"
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-56 bg-background-secondary border border-white/10 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden"
            >
              <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-colors ${
                      activeValue === opt.value ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

FilterButton.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  })).isRequired,
  activeValue: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

const Explore = ({ defaultOrder = 'default' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const currentOrder = searchParams.get('order') || defaultOrder;
  const currentStatus = searchParams.get('status') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentYear = searchParams.get('year') || '';

  const categories = [
    { label: 'Todos los Formatos', value: '' },
    { label: 'Series TV', value: 'tv' },
    { label: 'Películas', value: 'movie' },
    { label: 'OVAs', value: 'ova' },
    { label: 'Especiales', value: 'special' },
    { label: 'ONA', value: 'ona' },
  ];

  const statuses = [
    { label: 'Todos los Estados', value: '' },
    { label: 'En Emisión', value: 'on_air' },
    { label: 'Finalizados', value: 'complete' },
    { label: 'Próximamente', value: 'upcoming' },
  ];

  const orders = [
    { label: 'Por Defecto', value: 'default' },
    { label: 'Más Recientes', value: 'added' },
    { label: 'Mejor Calificados', value: 'rating' },
    { label: 'Título A-Z', value: 'title' },
  ];

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [currentOrder, currentStatus, currentCategory, currentYear]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['explore', currentOrder, currentStatus, currentCategory, currentYear, page],
    queryFn: () => animeService.getCatalog({
      order: currentOrder,
      status: currentStatus,
      category: currentCategory,
      year: currentYear,
      page: page
    }),
    keepPreviousData: true
  });

  const handleFilterChange = (key, value) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  // AnimeFLV gives 24 items, we slice to exactly 20
  const results = (data || []).slice(0, 20);
  const hasMore = (data || []).length >= 20;

  // Scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen px-4 lg:px-8 pb-24 animate-in fade-in duration-700">
      <div className="container mx-auto">
        <header className="py-12 lg:py-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                 <Compass size={24} className="animate-spin-slow" />
                 <span className="font-black uppercase tracking-[0.3em] text-[10px]">Explorador Cuántico</span>
              </div>
              <h1 className="font-display text-5xl lg:text-7xl font-black text-white italic tracking-tighter leading-none">
                {currentOrder === 'rating' ? 'Top Populares' : 'Descubrir'}
              </h1>
              <p className="text-text-secondary font-bold text-sm lg:text-base max-w-xl leading-relaxed">
                Filtra entre nuestra vasta biblioteca de anime. Encuentra exactamente lo que buscas por género, formato o popularidad.
              </p>
           </div>
           
           <div className="flex flex-wrap gap-3">
              <FilterButton 
                label="Formato" 
                options={categories} 
                activeValue={currentCategory} 
                onChange={(v) => handleFilterChange('category', v)} 
              />
              <FilterButton 
                label="Estado" 
                options={statuses} 
                activeValue={currentStatus} 
                onChange={(v) => handleFilterChange('status', v)} 
              />
              <FilterButton 
                label="Ordenar" 
                options={orders} 
                activeValue={currentOrder} 
                onChange={(v) => handleFilterChange('order', v)} 
              />
              <button 
                onClick={() => setSearchParams({})}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-all hover:bg-red-500/10 hover:border-red-500/20 group"
                title="Limpiar Filtros"
              >
                <Filter size={18} className="group-hover:scale-110 transition-transform" />
              </button>
           </div>
        </header>

        <div className="flex flex-col gap-8">

          {(isLoading && page === 1) ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => <AnimeCardSkeleton key={i} />)}
            </div>
          ) : (
            <>
              <motion.div 
                animate={{ opacity: isFetching ? 0.5 : 1, filter: isFetching ? 'blur(4px)' : 'blur(0px)' }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 min-h-[50vh] transition-all"
              >
                <AnimatePresence mode="popLayout">
                  {results.map((anime, i) => (
                    <AnimeCard key={`${anime.url || anime.id}-${i}`} anime={anime} index={i} />
                  ))}
                </AnimatePresence>
              </motion.div>

              {!isLoading && results.length === 0 && (
                <div className="py-24 flex flex-col items-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                    <Sparkles size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-white italic uppercase">Sin Resultados</h3>
                  <p className="text-text-secondary font-bold text-sm">Prueba ajustando los filtros para encontrar lo que buscas.</p>
                </div>
              )}

              {/* Paginación Clásica */}
              {results.length > 0 && (
                <div className="flex items-center justify-center gap-4 pt-16">
                  <button 
                    onClick={() => {
                      setPage(p => Math.max(1, p - 1));
                      scrollToTop();
                    }}
                    disabled={page === 1 || isFetching}
                    className="w-12 h-12 rounded-full bg-background-secondary border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="px-6 py-3 rounded-full bg-background-secondary border border-white/10 text-white font-black">
                    Página {page}
                  </div>

                  <button 
                    onClick={() => {
                      setPage(p => p + 1);
                      scrollToTop();
                    }}
                    disabled={!hasMore || isFetching}
                    className="w-12 h-12 rounded-full bg-background-secondary border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-28 lg:bottom-10 right-6 z-50 w-12 h-12 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95"
            title="Volver arriba"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

Explore.propTypes = {
  defaultOrder: PropTypes.string
};

export default Explore;
