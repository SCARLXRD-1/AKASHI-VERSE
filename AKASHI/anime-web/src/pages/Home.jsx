import { useQuery } from '@tanstack/react-query';
import { animeService } from '../services/animeService';
import HeroBanner from '../components/anime/HeroBanner';
import AnimeCard from '../components/cards/AnimeCard';
import { AnimeCardSkeleton, HeroSkeleton } from '../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Zap, TrendingUp, Sparkles, Play, AlertCircle, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnimeStore } from '../store/useAnimeStore';
import { useTV } from '../hooks/useTV';
import PropTypes from 'prop-types';

const SectionHeader = ({ title, icon: Icon, color = 'primary', to }) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-background-secondary border border-white/10 shadow-lg`}>
          <Icon className={`text-${color === 'primary' ? 'primary' : 'accent'}`} size={24} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-black text-white tracking-tight italic uppercase">{title}</h2>
          <div className={`h-1 w-12 bg-${color === 'primary' ? 'primary' : 'accent'} rounded-full mt-1 opacity-50`} />
        </div>
      </div>
      {to && (
        <button 
          onClick={() => navigate(to)}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors group"
        >
          Ver Todo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
  to: PropTypes.string
};

const Home = () => {
  const { history } = useAnimeStore();
  const { isTV } = useTV();

  const { data: trending, isLoading: loadingTrending, error: errorTrending } = useQuery({
    queryKey: ['trending'],
    queryFn: animeService.getTrending,
  });

  // Fetch full details for carousel items (current season) to get real synopses
  const { data: carouselAnimes, isLoading: loadingCarousel } = useQuery({
    queryKey: ['currentSeasonCarousel'],
    queryFn: async () => {
      const items = await animeService.getCurrentSeason();
      const initialValid = items.filter(item => item && item.url && item.title && item.title.trim().length > 0);
      const topItems = initialValid.slice(0, 12);
      const details = await Promise.all(
        topItems.map(async (item) => {
          try {
            const fullInfo = await animeService.getAnimeById(item.url);
            if (!fullInfo || !fullInfo.title || fullInfo.title.trim().length === 0) {
              return null;
            }
            return { ...item, ...fullInfo };
          } catch (fetchError) {
            console.warn(`[HeroBanner] Error fetching anime info: ${fetchError.message}`);
            if (item.title && item.title.trim().length > 0 && (item.image || item.backdrop)) {
              return item;
            }
            return null;
          }
        })
      );
      return details
        .filter(Boolean)
        .filter(item => {
          const hasTitle = item.title && item.title.trim().length > 0;
          const hasImage = item.backdrop || item.image;
          const isNotPlaceholder = item.title.toLowerCase() !== 'tv anime' && item.title.toLowerCase() !== 'anime';
          return hasTitle && hasImage && isNotPlaceholder;
        })
        .slice(0, 7);
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const { data: homeData, isLoading: loadingHome, error: errorHome } = useQuery({
    queryKey: ['homeData'],
    queryFn: animeService.getHomeData,
  });

  if (loadingTrending || loadingHome || loadingCarousel) {
    return (
      <div className="space-y-16 px-4 lg:px-8 pb-24">
        <HeroSkeleton />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[1,2,3,4,5,6].map(i => <AnimeCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (errorTrending || errorHome) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white italic">Error de Conexión</h2>
          <p className="text-text-secondary max-w-md mx-auto">No pudimos conectar con el motor Zenkai. Por favor verifica que el servidor API esté corriendo.</p>
        </div>
        <button 
          onClick={() => globalThis.location.reload()}
          className="primary-btn px-8 py-3"
        >
          Reintentar Conexión
        </button>
      </div>
    );
  }

  const latestEpisodes = homeData?.latestEpisodes || [];
  const schedule = homeData?.schedule || [];

  return (
    <div className="space-y-16 px-4 lg:px-8 pb-24 animate-in fade-in duration-700">
      {/* Hero Carousel */}
      {carouselAnimes && carouselAnimes.length > 0 && <HeroBanner animes={carouselAnimes} />}

      {/* Continue Watching */}
      {history && history.length > 0 && (
        <section>
          <SectionHeader title="Continuar Viendo" icon={Clock} color="accent" to="/historial" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
            {history
              .filter(a => a && a.url)
              .slice(0, 6)
              .map((anime, i) => (
                <AnimeCard key={`history-${anime.url || anime.title || i}`} anime={anime} index={i} isHistory={true} />
              ))}
          </div>
        </section>
      )}

      {/* Latest Releases */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-96 bg-primary/5 blur-3xl -z-10 rounded-full" />
        <SectionHeader title="Últimos Episodios" icon={Zap} color="accent" to="/explorar" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
          {latestEpisodes.slice(0, 16).map((anime, i) => (
            <AnimeCard key={`latest-${anime.watchUrl || anime.url || anime.title || i}`} anime={anime} index={i} isLatest={true} />
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <SectionHeader title="Tendencias" icon={TrendingUp} color="primary" to="/populares" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
          {(trending || []).slice(1, 17).map((anime, i) => (
            <AnimeCard key={anime.id || i} anime={anime} index={i} />
          ))}
        </div>
      </section>

      {/* Cartelera / Schedule */}
      {schedule.length > 0 && (
        <section>
          <SectionHeader title="Cartelera / En Emisión" icon={Calendar} color="primary" to="/explorar?status=on_air" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {schedule.slice(0, isTV ? 8 : 16).map((item, i) => {
              const ScheduleTag = isTV ? 'div' : motion.div;
              const schedProps = isTV ? {} : { whileHover: { x: 5 } };
              return (
                <ScheduleTag
                  key={`sched-${item.title || item.url || i}`}
                  {...schedProps}
                  className="flex items-center justify-between p-4 bg-background-secondary border border-white/5 rounded-2xl hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => {
                    const slug = (item.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    globalThis.location.href = `/anime/${slug}?url=${encodeURIComponent(item.url)}`;
                  }}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-white font-bold text-xs uppercase tracking-tight truncate group-hover:text-primary transition-colors">{item.title}</span>
                  </div>
                  <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{item.type}</span>
                </ScheduleTag>
              );
            })}
          </div>
        </section>
      )}

      {/* Features / Genres CTA */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        {[
          { title: 'Doblaje Latino', desc: 'Disfruta tus series favoritas en tu idioma.', icon: Sparkles, bg: 'from-primary/20' },
          { title: 'Calidad 4K', desc: 'Siente cada detalle con la mejor resolución.', icon: Play, bg: 'from-accent/20' },
          { title: 'Sin Anuncios', desc: 'Experiencia ininterrumpida para miembros Plus.', icon: Zap, bg: 'from-white/10' },
        ].map(feat => {
          const FeatTag = isTV ? 'div' : motion.div;
          const featProps = isTV ? {} : { whileHover: { y: -5 } };
          return (
            <FeatTag
              key={`feat-${feat.title}`}
              {...featProps}
              className={`p-8 rounded-[2.5rem] bg-gradient-to-br ${feat.bg} to-background-secondary border border-white/5 flex flex-col gap-4 group cursor-pointer shadow-xl`}
            >
              <div className="w-14 h-14 rounded-2xl bg-background-main flex items-center justify-center shadow-2xl">
                <feat.icon className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-white italic uppercase tracking-tight">{feat.title}</h3>
                <p className="text-text-secondary text-sm font-bold mt-1">{feat.desc}</p>
              </div>
            </FeatTag>
          );
        })}
      </section>
    </div>
  );
};

export default Home;
