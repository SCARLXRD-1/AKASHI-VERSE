import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Clock3, Flame, PlayCircle, Activity, Tv2, Star } from 'lucide-react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useAnimeStore } from '../store/useAnimeStore';
import { proxyImage } from '../services/animeService';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150' viewBox='0 0 100 150'%3E%3Crect width='100' height='150' fill='%231a1a2e'/%3E%3C/svg%3E";

const formatDate = (value) => {
  if (!value) return 'Sin actividad';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(value));
};

const TONE_CLASSES = {
  accent: 'bg-accent/10 text-accent',
  green: 'bg-green-500/10 text-green-400',
  orange: 'bg-orange-500/10 text-orange-400',
  primary: 'bg-primary/10 text-primary',
};

const StatCard = ({ icon: Icon, label, value, tone = 'primary', index = 0 }) => {
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.primary;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-[1.75rem] border border-white/5 bg-background-secondary/70 p-6 shadow-xl shadow-black/20 flex flex-col justify-between"
    >
      <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary">{label}</p>
        <p className="mt-2 font-display text-4xl font-black italic text-white">{value}</p>
      </div>
    </motion.div>
  );
};

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.string,
  index: PropTypes.number
};

const ActivityHeatmap = ({ dailyActivity }) => {
  // Generate last 60 days
  const days = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().split('T')[0]);
    }
    return arr;
  }, []);

  return (
    <div className="rounded-[2rem] border border-white/5 bg-background-secondary/50 p-6 lg:p-8 overflow-hidden">
      <div className="flex items-center gap-3 mb-8">
        <Activity className="text-primary" size={20} />
        <h2 className="font-display text-xl font-black italic uppercase text-white">Actividad de Visualización</h2>
      </div>
      
      <div className="flex items-end gap-1 overflow-x-auto pb-4 custom-scrollbar">
        {days.map((dateStr, i) => {
          const count = dailyActivity[dateStr] || 0;
          let colorClass = 'bg-white/5';
          if (count > 0) colorClass = 'bg-primary/30';
          if (count > 2) colorClass = 'bg-primary/60';
          if (count > 5) colorClass = 'bg-primary';
          if (count > 10) colorClass = 'bg-accent';

          return (
            <div key={dateStr} className="group relative flex flex-col items-center gap-2">
              <div 
                className={`w-3 md:w-4 rounded-sm transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer ${colorClass}`}
                style={{ height: `${Math.max(20, Math.min(100, (count || 1) * 15))}px` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-50">
                <div className="bg-background-main border border-white/10 text-white text-[10px] font-bold px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                  {count} eps — {formatDate(dateStr)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
        <span>Menos</span>
        <div className="w-3 h-3 rounded-sm bg-white/5" />
        <div className="w-3 h-3 rounded-sm bg-primary/30" />
        <div className="w-3 h-3 rounded-sm bg-primary/60" />
        <div className="w-3 h-3 rounded-sm bg-primary" />
        <div className="w-3 h-3 rounded-sm bg-accent" />
        <span>Más</span>
      </div>
    </div>
  );
};

ActivityHeatmap.propTypes = {
  dailyActivity: PropTypes.object,
};

const ProfileStats = () => {
  const { history, totalEpisodesWatched, dailyActivity, genreStats } = useAnimeStore();

  const stats = useMemo(() => {
    const validHistory = history.filter((anime) => anime?.url);
    const uniqueAnimes = validHistory.length;
    const latestActivity = validHistory[0]?.watchedAt;
    
    // Convert genre object to sorted array
    const topGenres = Object.entries(genreStats || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Estimate hours (24 mins per ep)
    const totalHours = Math.round(((totalEpisodesWatched || 0) * 24) / 60);

    return {
      validHistory,
      uniqueAnimes,
      latestActivity,
      topGenres,
      totalHours,
    };
  }, [history, genreStats, totalEpisodesWatched]);

  const topRecent = stats.validHistory.slice(0, 5);

  return (
    <div className="min-h-screen px-4 lg:px-8 pb-24">
      <div className="container space-y-10">
        <header className="py-12 lg:py-16">
          <div className="flex items-center gap-3 text-primary">
            <BarChart3 size={24} />
            <span className="font-black uppercase tracking-[0.3em] text-[10px]">Dashboard</span>
          </div>
          <div className="mt-4 max-w-3xl">
            <h1 className="font-display text-5xl lg:text-7xl font-black text-white italic tracking-tighter leading-none">
              Tu Universo <span className="gradient-text pr-2">Anime</span>
            </h1>
            <p className="mt-4 text-text-secondary font-bold text-sm lg:text-base leading-relaxed">
              Analizamos tus patrones de visualización para mostrarte exactamente cómo inviertes tu tiempo en Zenkai.
            </p>
          </div>
        </header>

        {/* Top KPI Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Tv2} label="Animes Empezados" value={stats.uniqueAnimes} index={0} />
          <StatCard icon={PlayCircle} label="Total Episodios" value={totalEpisodesWatched || 0} tone="accent" index={1} />
          <StatCard icon={Clock3} label="Horas Invertidas" value={`${stats.totalHours}h`} tone="orange" index={2} />
          <StatCard icon={Flame} label="Última Sesión" value={stats.latestActivity ? "Hoy" : "N/A"} tone="green" index={3} />
        </section>

        {/* Heatmap & Genres */}
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <ActivityHeatmap dailyActivity={dailyActivity || {}} />

          <div className="rounded-[2rem] border border-white/5 bg-background-secondary/50 p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-8">
              <Star className="text-accent" size={20} />
              <h2 className="font-display text-xl font-black italic uppercase text-white">Top Géneros</h2>
            </div>
            
            {stats.topGenres.length === 0 ? (
              <p className="text-sm font-bold text-text-secondary text-center py-10">
                Aún no hay datos de géneros. ¡Empieza a ver anime!
              </p>
            ) : (
              <div className="space-y-4">
                {stats.topGenres.map(([genre, count], idx) => {
                  // Calculate max for progress bar
                  const maxCount = stats.topGenres[0][1];
                  const percent = Math.round((count / maxCount) * 100);
                  
                  return (
                    <motion.div 
                      key={genre}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: '100%', opacity: 1 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                    >
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white mb-2">
                        <span>{genre}</span>
                        <span className="text-primary">{count} eps</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Recent History List */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-black italic uppercase text-white">Continuar Viendo</h2>
            <Link to="/historial" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors">
              Ver Historial Completo →
            </Link>
          </div>

          {topRecent.length === 0 ? (
             <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.5rem] border border-white/5 bg-background-secondary/50 px-6 text-center">
               <Clock3 className="mb-4 text-white/20" size={42} />
               <p className="mt-2 max-w-md text-sm font-bold text-text-secondary">
                 No tienes animes pendientes. Explora el catálogo para empezar.
               </p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {topRecent.map((anime, index) => (
                <Link 
                  to={`/anime/${(anime.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}?url=${encodeURIComponent(anime.url)}`}
                  key={`${anime.url}-${index}`}
                  className="group relative aspect-[4/3] rounded-[1.5rem] overflow-hidden border border-white/5 flex items-end p-5"
                >
                  <img 
                    src={proxyImage(anime.backdrop || anime.image) || IMG_FALLBACK}
                    alt={anime.title}
                    onError={(e) => { e.target.src = IMG_FALLBACK; }}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background-main via-background-main/50 to-transparent" />
                  
                  <div className="relative z-10 w-full">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">
                      Episodio {anime.lastEpisode}
                    </p>
                    <h3 className="font-black text-white truncate text-sm group-hover:text-primary transition-colors">
                      {anime.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfileStats;
