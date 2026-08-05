import { motion } from 'framer-motion';
import { Play, Star, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnimeStore } from '../../store/useAnimeStore';
import { proxyImage } from '../../services/animeService';
import { useTV } from '../../hooks/useTV';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff20' font-size='64' font-family='sans-serif'%3E%E2%96%B6%3C/text%3E%3C/svg%3E";

const AnimeCard = ({ anime, index = 0, isHistory = false, isLatest = false }) => {
  const { isTV } = useTV();
  const navigate = useNavigate();
  const { toggleFavorite, favorites } = useAnimeStore();
  const isFavorite = favorites.some(f => f.url === anime.url);

  const handleClick = () => {
    const slug = (anime.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (isHistory && anime.lastEpisodeUrl) {
      navigate(`/watch/${slug}?url=${encodeURIComponent(anime.lastEpisodeUrl)}&anime=${encodeURIComponent(anime.url)}`);
    } else if (isLatest && anime.watchUrl) {
      navigate(`/watch/${slug}?url=${encodeURIComponent(anime.watchUrl)}&anime=${encodeURIComponent(anime.url)}`);
    } else {
      navigate(`/anime/${slug}?url=${encodeURIComponent(anime.url)}`);
    }
  };

  const MotionTag = isTV ? 'div' : motion.div;
  const motionProps = isTV ? {} : {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay: index * 0.05 },
    whileHover: { y: -8 },
  };

  return (
    <MotionTag
      {...motionProps}
      className="group relative flex flex-col gap-3 cursor-pointer"
      onClick={handleClick}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/5 bg-background-secondary shadow-lg shadow-black/40">
        <img 
          src={proxyImage(anime.image) || IMG_FALLBACK} 
          alt={anime.title}
          onError={e => { e.target.src = IMG_FALLBACK; }}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background-main via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {anime.score && parseFloat(anime.score) > 0 && anime.score !== '4.8' && (
            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xl">
              <Star size={12} className="text-accent fill-accent" />
              <span className="text-[10px] font-black text-white">{anime.score}</span>
            </div>
          )}
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(anime);
          }}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 border backdrop-blur-md ${
            isFavorite 
              ? 'bg-primary border-primary text-white scale-110' 
              : 'bg-black/60 border-white/10 text-white hover:text-primary hover:border-primary/50'
          }`}
        >
          <Bookmark size={14} fill={isFavorite ? 'white' : 'none'} />
        </button>

        {/* Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-50 group-hover:scale-100">
           <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/40">
             <Play size={28} className="text-white fill-white ml-1" />
           </div>
        </div>

        {/* Type Badge */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5">
          {isHistory && anime.lastEpisode && (
            <span className="bg-accent text-background-main text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg">
              EP {anime.lastEpisode}
            </span>
          )}
          {isLatest && anime.episode && (
            <span className="bg-accent text-background-main text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg">
              {anime.episode}
            </span>
          )}
          <span className="bg-primary/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg w-fit">
            {anime.type === 'TV Anime' ? 'Serie' : anime.type || 'Anime'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-2 space-y-1">
        <h3 className="font-display font-black text-white text-sm line-clamp-2 leading-tight transition-colors group-hover:text-primary">
          {anime.title}
        </h3>
        {(anime.year || anime.episodes?.length) && (
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">
            {anime.year || ''} {anime.year && anime.episodes?.length ? '•' : ''} {anime.episodes?.length ? `${anime.episodes.length} EPISODIOS` : ''}
          </p>
        )}
      </div>
    </MotionTag>
  );
};

export default AnimeCard;
