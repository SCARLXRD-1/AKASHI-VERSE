import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Plus, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { proxyImage } from '../../services/animeService';
import { useTV } from '../../hooks/useTV';
import PropTypes from 'prop-types';

const HeroBanner = ({ animes = [] }) => {
  const { isTV } = useTV();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();

  const activeAnime = animes[currentIndex];

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % animes.length);
  }, [animes.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length);
  }, [animes.length]);

  useEffect(() => {
    if (animes.length <= 1 || isTV) return;
    const timer = setInterval(handleNext, 8000);
    return () => clearInterval(timer);
  }, [handleNext, animes.length, isTV]);

  const handlePlay = () => {
    if (!activeAnime) return;
    const slug = (activeAnime.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/anime/${slug}?url=${encodeURIComponent(activeAnime.url)}`);
  };

  if (!animes || animes.length === 0) return null;

  const variants = isTV ? {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  } : {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      filter: 'blur(10px)',
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      filter: 'blur(10px)',
      transition: { duration: 0.4 }
    })
  };

  return (
    <div className="relative w-full h-[75vh] lg:h-[80vh] rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden group bg-background-main border border-white/5 shadow-2xl">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 200, damping: 25 },
            opacity: { duration: 0.4 },
            filter: { duration: 0.4 }
          }}
          className="absolute inset-0"
        >
          {/* Background with Zoom Effect */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.img 
              initial={isTV ? {} : { scale: 1.2 }}
              animate={isTV ? {} : { scale: 1 }}
              transition={isTV ? {} : { duration: 8 }}
              src={proxyImage(activeAnime.backdrop || activeAnime.image)} 
              alt={activeAnime.title}
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/zenkai-logo.jpeg';
              }}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 hero-gradient-r z-10" />
            <div className="absolute inset-0 hero-gradient-t z-10" />
          </div>

          {/* Content Wrapper */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center">
            <div className="container mx-auto px-6 lg:px-16">
              <div className="max-w-3xl space-y-6 lg:space-y-8">
                {/* Badge & Info */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-4"
                >
                  {activeAnime.score && (
                    <div className="flex items-center gap-2 bg-primary/20 backdrop-blur-xl border border-primary/30 px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">
                      <Star size={14} className="text-primary fill-primary" />
                      <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{activeAnime.score} Score</span>
                    </div>
                  )}
                  <div className="h-4 w-[1px] bg-white/10" />
                  <span className="text-white/40 font-bold text-[10px] uppercase tracking-[0.3em]">
                    {[activeAnime.year, activeAnime.type, (activeAnime.totalEpisodes || activeAnime.episodes?.length) ? `${activeAnime.totalEpisodes || activeAnime.episodes.length} EP` : null]
                      .filter(Boolean).join(' • ')}
                  </span>
                </motion.div>

                {/* Title - Reduced Size & Limited Lines */}
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight italic uppercase line-clamp-2 drop-shadow-2xl py-1"
                >
                  {activeAnime.title}
                </motion.h1>

                {/* Real Synopsis / Description */}
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-text-secondary text-sm lg:text-base max-w-xl font-medium leading-relaxed line-clamp-3 opacity-80"
                >
                  {activeAnime.description || activeAnime.synopsis || 'Explora esta increíble historia en Zenkai Anime. Calidad de imagen superior y los mejores servidores para que no te pierdas ni un detalle.'}
                </motion.p>

                {/* Main Actions */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap items-center gap-4 pt-2"
                >
                  <button 
                    onClick={handlePlay}
                    className="primary-btn px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-black flex items-center gap-3 shadow-2xl shadow-primary/40 hover:scale-105 transition-transform"
                  >
                    <Play size={18} fill="white" /> Reproducir Ahora
                  </button>
                  <button className="secondary-btn px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-black flex items-center gap-3 border-white/10 hover:bg-white/10 hover:scale-105 transition-transform">
                    <Plus size={18} /> Mi Lista
                  </button>
                  <button className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-xl">
                    <Info size={22} />
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Manual Navigation Controls - Moved to corner for better framing */}
      <div className="absolute bottom-12 right-12 z-30 flex flex-col items-end gap-6">
        {/* Indicators */}
        <div className="flex gap-2">
          {animes.map((anime, i) => (
            <button 
              key={anime?.id || anime?.url || i} 
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                setCurrentIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-700 ${i === currentIndex ? 'w-10 bg-primary shadow-lg shadow-primary/50' : 'w-3 bg-white/10 hover:bg-white/30'}`} 
            />
          ))}
        </div>
        
        {/* Arrows */}
        <div className="flex gap-3">
           <button onClick={handlePrev} className="w-12 h-12 rounded-2xl bg-background-main/40 backdrop-blur-2xl border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-primary/20 hover:border-primary/30 transition-all group">
              <ChevronLeft size={20} className="group-active:scale-90 transition-transform" />
           </button>
           <button onClick={handleNext} className="w-12 h-12 rounded-2xl bg-background-main/40 backdrop-blur-2xl border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-primary/20 hover:border-primary/30 transition-all group">
              <ChevronRight size={20} className="group-active:scale-90 transition-transform" />
           </button>
        </div>
      </div>
    </div>
  );
};

HeroBanner.propTypes = {
  animes: PropTypes.array
};

export default memo(HeroBanner);
