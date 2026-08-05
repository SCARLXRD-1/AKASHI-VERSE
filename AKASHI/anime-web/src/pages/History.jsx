import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, RotateCcw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnimeStore } from '../store/useAnimeStore';
import { proxyImage } from '../services/animeService';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff20' font-size='64' font-family='sans-serif'%3E%E2%96%B6%3C/text%3E%3C/svg%3E";

const formatWatchedAt = (value) => {
  if (!value) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const History = () => {
  const navigate = useNavigate();
  const { history, clearHistory } = useAnimeStore();

  const validHistory = useMemo(
    () => history.filter((anime) => anime?.url),
    [history]
  );

  const handleOpenAnime = (anime) => {
    const slug = (anime.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/anime/${slug}?url=${encodeURIComponent(anime.url)}`);
  };

  const handleContinue = (anime) => {
    if (anime.lastEpisodeUrl) {
      const slug = (anime.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      navigate(`/watch/${slug}?url=${encodeURIComponent(anime.lastEpisodeUrl)}&anime=${encodeURIComponent(anime.url)}`);
      return;
    }

    handleOpenAnime(anime);
  };

  return (
    <div className="min-h-screen px-4 lg:px-8 pb-24">
      <div className="container space-y-10">
        <header className="py-12 lg:py-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-accent">
              <Clock size={24} />
              <span className="font-black uppercase tracking-[0.3em] text-[10px]">Actividad reciente</span>
            </div>
            <div>
              <h1 className="font-display text-5xl lg:text-7xl font-black text-white italic tracking-tighter leading-none">
                Historial
              </h1>
              <p className="text-text-secondary font-bold text-sm lg:text-base max-w-xl leading-relaxed mt-4">
                Retoma tus episodios recientes y vuelve a las series que abriste en esta cuenta local.
              </p>
            </div>
          </div>

          {validHistory.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-red-300 transition-all hover:bg-red-500/20"
            >
              <Trash2 size={16} />
              Limpiar
            </button>
          )}
        </header>

        {validHistory.length === 0 ? (
          <section className="flex min-h-[42vh] flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-background-secondary/40 px-6 py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white/30">
              <RotateCcw size={38} />
            </div>
            <h2 className="font-display text-2xl font-black italic uppercase text-white">Aun no hay historial</h2>
            <p className="mt-3 max-w-md text-sm font-bold leading-relaxed text-text-secondary">
              Cuando reproduzcas un episodio, aparecerá aquí para que puedas continuar más rápido.
            </p>
          </section>
        ) : (
          <section className="grid gap-4">
            {validHistory.map((anime, index) => (
              <motion.article
                key={`${anime.url}-${anime.watchedAt || index}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="group grid grid-cols-[84px_1fr] gap-4 rounded-[1.75rem] border border-white/5 bg-background-secondary/70 p-3 shadow-xl shadow-black/20 transition-all hover:border-primary/40 sm:grid-cols-[104px_1fr_auto]"
              >
                <button
                  type="button"
                  onClick={() => handleOpenAnime(anime)}
                  className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-background-main"
                  aria-label={`Abrir ${anime.title}`}
                >
                  <img
                    src={proxyImage(anime.image) || IMG_FALLBACK}
                    alt={anime.title}
                    onError={(event) => { event.currentTarget.src = IMG_FALLBACK; }}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background-main/80 to-transparent" />
                </button>

                <div className="flex min-w-0 flex-col justify-center gap-3 py-1">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent">
                      Episodio {anime.lastEpisode || 'reciente'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAnime(anime)}
                      className="block max-w-full text-left font-display text-lg font-black italic leading-tight text-white transition-colors hover:text-primary sm:text-2xl"
                    >
                      <span className="line-clamp-2">{anime.title}</span>
                    </button>
                    <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">
                      Visto {formatWatchedAt(anime.watchedAt)}
                    </p>
                  </div>
                </div>

                <div className="col-span-2 flex items-center sm:col-span-1 sm:pr-2">
                  <button
                    type="button"
                    onClick={() => handleContinue(anime)}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/35 sm:w-auto"
                  >
                    <Play size={16} fill="currentColor" />
                    Continuar
                  </button>
                </div>
              </motion.article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default History;
