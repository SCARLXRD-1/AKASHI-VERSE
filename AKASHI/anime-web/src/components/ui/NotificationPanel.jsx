import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Play, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAnimeStore } from '../../store/useAnimeStore';
import { animeService, proxyImage } from '../../services/animeService';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='150' viewBox='0 0 100 150'%3E%3Crect width='100' height='150' fill='%231a1a2e'/%3E%3C/svg%3E";

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { history } = useAnimeStore();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { data: homeData } = useQuery({
    queryKey: ['homeData'],
    queryFn: animeService.getHomeData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const recentEpisodes = homeData?.recentEpisodes || [];

  // Find matches between user history and recent episodes
  const notifications = useMemo(() => {
    if (!recentEpisodes || recentEpisodes.length === 0) return [];
    
    return recentEpisodes
      .filter(ep => {
        // Find if this anime is in our history
        const historyItem = history.find(h => h.id === ep.anime?.id || h.title === ep.anime?.title);
        if (!historyItem) return false;
        
        // Only notify if the new episode is strictly GREATER than the last one we watched
        const lastWatched = Number.parseFloat(historyItem.lastEpisode || 0);
        const newEpNumber = Number.parseFloat(ep.number || 0);
        
        return newEpNumber > lastWatched;
      })
      .slice(0, 5); // Limit to top 5
  }, [recentEpisodes, history]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors relative ${
          isOpen ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:text-white hover:bg-white/5'
        }`}
        title="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background-main animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-3 w-80 bg-background-secondary/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/80 p-2 z-[200]"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <h3 className="text-sm font-black italic uppercase text-white">Notificaciones</h3>
              </div>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary px-2 py-1 rounded-md">
                  {unreadCount} Nuevas
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <Bell size={32} className="text-white/10 mb-3" />
                  <p className="text-sm font-bold text-text-secondary">Todo al día</p>
                  <p className="text-[10px] text-white/30 mt-1">No hay episodios nuevos para los animes que sigues.</p>
                </div>
              ) : (
                notifications.map((notif, i) => (
                  <button
                    key={notif.url || i}
                    onClick={() => {
                      setIsOpen(false);
                      const slug = (notif.anime?.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      navigate(`/watch/${notif.anime?.id || slug}?url=${encodeURIComponent(notif.url)}&anime=${encodeURIComponent(notif.anime?.url || '')}`);
                    }}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors group relative"
                  >
                    <div className="w-12 h-16 rounded-xl overflow-hidden shrink-0">
                      <img 
                        src={proxyImage(notif.image || notif.anime?.image) || IMG_FALLBACK} 
                        alt=""
                        onError={(e) => { e.target.src = IMG_FALLBACK; }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                        ¡Nuevo Episodio {notif.number}!
                      </p>
                      <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                        {notif.anime?.title || 'Anime Reciente'}
                      </p>
                      <p className="text-[10px] text-text-secondary mt-1">Clic para reproducir ahora.</p>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPanel;
