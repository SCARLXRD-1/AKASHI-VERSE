import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Play, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnimeStore } from '../store/useAnimeStore';
import { proxyImage } from '../services/animeService';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff20' font-size='64' font-family='sans-serif'%3E%E2%96%B6%3C/text%3E%3C/svg%3E";

const MyList = () => {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useAnimeStore();

  const validFavorites = useMemo(
    () => favorites.filter((anime) => anime?.url),
    [favorites]
  );

  const handleOpenAnime = (anime) => {
    const slug = (anime.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/anime/${slug}?url=${encodeURIComponent(anime.url)}`);
  };

  return (
    <div className="min-h-screen px-4 lg:px-8 pb-24">
      <div className="container space-y-10">
        <header className="py-12 lg:py-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Bookmark size={24} />
              <span className="font-black uppercase tracking-[0.3em] text-[10px]">Tu Colección</span>
            </div>
            <div>
              <h1 className="font-display text-5xl lg:text-7xl font-black text-white italic tracking-tighter leading-none">
                Favoritos
              </h1>
              <p className="text-text-secondary font-bold text-sm lg:text-base max-w-xl leading-relaxed mt-4">
                Todos tus animes guardados para ver más tarde están aquí.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-text-secondary bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-xl">
            <span className="text-white text-xl">
              {validFavorites.length}
            </span>
            <span className="opacity-50">Guardados</span>
          </div>
        </header>

        {validFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 lg:py-32 bg-background-secondary/50 rounded-[2rem] border border-white/5 text-center px-4">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Bookmark size={32} className="text-white/20" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 italic">Aún no hay favoritos</h2>
            <p className="text-text-secondary font-bold max-w-md">
              Explora el catálogo y guarda los animes que más te gusten para tenerlos a la mano.
            </p>
            <button 
              onClick={() => navigate('/explorar')}
              className="mt-8 px-8 py-4 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
            {validFavorites.map((anime, index) => {
              const imageUrl = anime.cover || anime.image;
              
              return (
                <motion.div
                  key={`${anime.url}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex flex-col gap-3"
                >
                  <div 
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-background-secondary cursor-pointer"
                    onClick={() => handleOpenAnime(anime)}
                  >
                    <img
                      src={imageUrl ? proxyImage(imageUrl) : IMG_FALLBACK}
                      alt={anime.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        if (e.target.src !== IMG_FALLBACK) {
                          e.target.src = IMG_FALLBACK;
                        }
                      }}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75 group-hover:scale-100">
                      <div className="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center backdrop-blur-md shadow-xl shadow-primary/30">
                        <Play size={24} className="ml-1 fill-white" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenAnime(anime)}>
                        {anime.title}
                      </h3>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(anime);
                      }}
                      className="shrink-0 p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors group/btn"
                      title="Quitar de favoritos"
                    >
                      <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyList;
