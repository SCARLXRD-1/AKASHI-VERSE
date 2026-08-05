import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { animeService } from '../services/animeService';
import AnimeCard from '../components/cards/AnimeCard';
import { AnimeCardSkeleton } from '../components/ui/Skeleton';
import { Calendar as CalendarIcon, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['calendar-upcoming', page],
    queryFn: () => animeService.getCatalog({ status: 'upcoming', order: 'default', page: page }),
    keepPreviousData: true
  });

  const results = (data || []).slice(0, 20);
  const hasMore = (data || []).length >= 20;

  return (
    <div className="min-h-screen px-4 lg:px-8 pb-24">
      <div className="container mx-auto">
        <header className="py-12 lg:py-16 space-y-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3 text-accent">
                 <CalendarIcon size={24} className="animate-pulse" />
                 <span className="font-black uppercase tracking-[0.3em] text-[10px]">Próximos Estrenos</span>
              </div>
              <h1 className="font-display text-5xl lg:text-7xl font-black text-white italic tracking-tighter leading-none">
                Calendario <span className="text-accent">Zenkai</span>
              </h1>
              <p className="text-text-secondary font-bold text-sm lg:text-base max-w-xl leading-relaxed">
                Descubre los animes que están por llegar. Prepara tus snacks y añade a tu lista los próximos éxitos de la temporada.
              </p>
           </div>
        </header>

        {(isLoading && page === 1) ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => <AnimeCardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 min-h-[50vh]">
              {results.map((anime, i) => (
                <AnimeCard key={`${anime.url || anime.id}-${i}`} anime={anime} index={i} />
              ))}
            </div>

            {results.length > 0 && (
              <div className="flex items-center justify-center gap-4 pt-16">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isFetching}
                  className="w-12 h-12 rounded-full bg-background-secondary border border-white/10 flex items-center justify-center text-white hover:bg-accent hover:border-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="px-6 py-3 rounded-full bg-background-secondary border border-white/10 text-white font-black">
                  Página {page}
                </div>

                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore || isFetching}
                  className="w-12 h-12 rounded-full bg-background-secondary border border-white/10 flex items-center justify-center text-white hover:bg-accent hover:border-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}

        {!isLoading && results.length === 0 && (
          <div className="py-32 flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/5">
              <Sparkles size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white italic uppercase">Sin Próximos Estrenos</h3>
              <p className="text-text-secondary font-bold text-sm">Parece que no hay animes anunciados próximamente en este momento.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
