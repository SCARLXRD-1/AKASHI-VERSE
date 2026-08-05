import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { animeService } from '../services/animeService';
import AnimeCard from '../components/cards/AnimeCard';
import { AnimeCardSkeleton } from '../components/ui/Skeleton';
import { Search as SearchIcon, X, SlidersHorizontal, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [page, setPage] = useState(1);

  const { data: results, isLoading, isFetching } = useQuery({
    queryKey: ['search', query, page],
    queryFn: () => animeService.searchAnime(query, { page }),
    enabled: query.length > 0,
    keepPreviousData: true,
  });

  // Reset page when query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <div className="min-h-screen px-4 lg:px-8 pb-24">
      <div className="container mx-auto">
        {/* Header */}
        <header className="py-16 lg:py-24 flex flex-col items-center text-center space-y-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-[2.5rem] flex items-center justify-center text-primary shadow-2xl shadow-primary/20 relative group"
          >
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:blur-3xl transition-all" />
            <SearchIcon size={48} className="relative z-10 group-hover:scale-110 transition-transform" />
          </motion.div>
          
          <div className="space-y-4 max-w-3xl">
            <h1 className="font-display text-5xl lg:text-7xl font-black text-white tracking-tighter italic uppercase leading-none">
              {query ? (
                <>Encontrado en <span className="gradient-text">Zenkai</span></>
              ) : (
                <>Inicia tu <span className="gradient-text">Búsqueda</span></>
              )}
            </h1>
            <p className="text-text-secondary font-bold uppercase tracking-[0.3em] text-[10px] lg:text-xs">
              {query ? `Explorando dimensiones para "${query}"` : 'Accede a la base de datos más completa de anime en español'}
            </p>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 p-8 glass-card border-white/5 gap-6">
           <div className="flex items-center gap-5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Estado del Motor</span>
                <span className="text-xs font-black text-primary uppercase italic mt-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Operacional v4.2
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10 hidden md:block" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Resultados</span>
                <span className="text-xs font-black text-white uppercase italic mt-1">
                  {results?.length || 0} Títulos
                </span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              {isFetching && (
                <div className="flex items-center gap-2 text-[10px] font-black text-text-secondary uppercase tracking-widest animate-pulse">
                  <Loader2 size={12} className="animate-spin" /> Escaneando...
                </div>
              )}
              <button className="secondary-btn py-3 px-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                 <SlidersHorizontal size={16} /> Refinar Búsqueda
              </button>
           </div>
        </div>

        {/* Content */}
        {!query ? (
          <div className="py-24 flex flex-col items-center text-center space-y-8">
            <div className="w-32 h-32 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/10">
               <Sparkles size={64} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">El universo te espera</h3>
              <p className="text-text-secondary font-bold text-sm max-w-sm mx-auto">Escribe el nombre de un anime arriba para iniciar la extracción de datos.</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => <AnimeCardSkeleton key={i} />)}
          </div>
        ) : results?.length > 0 ? (
          <>
            <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 transition-all duration-500 ${isFetching ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}>
              {results.map((anime, i) => (
                <AnimeCard key={anime.id || i} anime={anime} index={i} />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-20 flex flex-col items-center gap-8">
              <div className="flex items-center gap-3">
                <button 
                  disabled={page === 1 || isFetching}
                  onClick={() => {
                    setPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-14 h-14 rounded-2xl bg-background-secondary border border-white/5 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/50 transition-all group"
                >
                  <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <div className="px-8 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-white font-black text-sm uppercase tracking-[0.2em]">Página {page}</span>
                </div>

                <button 
                  disabled={!results || results.length < 20 || isFetching}
                  onClick={() => {
                    setPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-14 h-14 rounded-2xl bg-background-secondary border border-white/5 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/50 transition-all group"
                >
                  <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-32 flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-500">
            <div className="p-10 rounded-[3rem] bg-red-500/5 border border-red-500/10 text-red-500/30">
              <X size={80} strokeWidth={1} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter leading-none">Error de Extracción</h3>
              <p className="text-text-secondary font-bold text-sm max-w-md mx-auto">No se encontraron coincidencias en la base de datos de Zenkai. Revisa la ortografía o intenta con términos más simples.</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="primary-btn px-10 py-4"
            >
              Volver al Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
