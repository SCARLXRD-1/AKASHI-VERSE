/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { animeService } from '../services/animeService';
import { useAnimeStore } from '../store/useAnimeStore';
import {
  Loader2, ChevronLeft, List, Globe, MessageCircle,
  Info, AlertCircle, Server,
  ChevronRight, X, Play, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { usePopupBlocker } from '../hooks/usePopupBlocker';
import { useTV } from '../hooks/useTV';
import CustomVideoPlayer from '../components/video/CustomVideoPlayer';

const AUTONEXT_SECS   = 10;   // seconds for the countdown

const isDirectVideoUrl = (url = '') => /\.(mp4|webm|ogg|m3u8)(?:[?#]|$)/i.test(url);

const transformToDirectVideoUrl = (url = '') => {
  if (!url) return '';
  // Convert PixelDrain UI links to direct API file links
  if (url.includes('pixeldrain.com/u/')) {
    return url.replace('/u/', '/api/file/').split('?')[0];
  }
  return url;
};

// Fallback image placeholder (dark gradient SVG)
const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'%3E%3Crect width='400' height='600' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff30' font-size='48' font-family='sans-serif'%3E%3F%3C/text%3E%3C/svg%3E";

const EP_PAGE_SIZE = 20;

const Watch = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const episodeUrl = searchParams.get('url');
  const animeUrl   = searchParams.get('anime');
  const navigate   = useNavigate();
  const { addToHistory, updateProgress, history } = useAnimeStore();
  const { isTV } = useTV();
  const [epPage, setEpPage] = useState(0);

  // ── Popup Blocker ─────────────────────────────────────────────────────────
  usePopupBlocker({ enabled: true });

  // Scroll to top when entering page or changing episode
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id, episodeUrl]);

  const location = useLocation();
  const [hasStarted, setHasStarted] = useState(location.state?.autoPlay || false);

  // ── UI State ──────────────────────────────────────────────────────────────
  const [language,       setLanguage]      = useState('sub');
  const [showEpList,     setShowEpList]    = useState(false);
  const [serverIdx,      setServerIdx]     = useState(0);
  const [iframeLoaded,   setIframeLoaded]  = useState(false);

  const [autoNextCount,  setAutoNextCount] = useState(null); // null = inactive

  const autoNextRef = useRef(null);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: anime, isLoading: loadingAnime } = useQuery({
    queryKey: ['anime', animeUrl],
    queryFn: () => animeService.getAnimeById(animeUrl),
    enabled: !!animeUrl,
  });

  const { data: episodeData, isLoading: loadingEpisode, error: errorEpisode } = useQuery({
    queryKey: ['episode', episodeUrl],
    queryFn: () => animeService.getEpisode(episodeUrl),
    enabled: !!episodeUrl,
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const currentEpNum = Number.parseFloat(episodeData?.episode);
  const sorted = [...(anime?.episodes || [])].sort((a, b) => Number.parseFloat(a.number) - Number.parseFloat(b.number));
  const nextEp = sorted.find(e => Number.parseFloat(e.number) > currentEpNum);
  const prevEp = [...sorted].reverse().find(e => Number.parseFloat(e.number) < currentEpNum);

  // Paginate episode list for TV performance
  const totalEpPages = Math.ceil(sorted.length / EP_PAGE_SIZE);
  const paginatedEps = useMemo(() => {
    if (!isTV || sorted.length <= EP_PAGE_SIZE) return sorted;
    const start = epPage * EP_PAGE_SIZE;
    return sorted.slice(start, start + EP_PAGE_SIZE);
  }, [sorted, epPage, isTV]);

  const targetKey = language.toUpperCase();
  const servers = (() => {
    const s = episodeData?.servers;
    if (!s) return [];
    if (Array.isArray(s)) return s;
    // Try exact match first, then common alternatives, then ANY non-empty array
    const direct = s[targetKey] || s[language];
    if (direct?.length) return direct;
    const fallbacks = s.LAT || s.lat || s.DUB || s.dub || s.SUB || s.sub;
    if (fallbacks?.length) return fallbacks;
    // Last resort: grab the first non-empty array from any key
    for (const val of Object.values(s)) {
      if (Array.isArray(val) && val.length > 0) return val;
    }
    return [];
  })();
    
  const selectedServer = servers[serverIdx] || null;
  const rawServerUrl = selectedServer?.url || selectedServer?.code || '';
  const selectedServerUrl = transformToDirectVideoUrl(rawServerUrl);
  const directVideo = isDirectVideoUrl(selectedServerUrl) || selectedServerUrl.includes('pixeldrain.com/api/file/');
  const historyItem = history.find(h => h.url === animeUrl);
  const initialTime = historyItem?.lastEpisodeUrl === episodeUrl ? historyItem?.currentTime || 0 : 0;
  const autoNextProgress = autoNextCount === null ? 0 : ((AUTONEXT_SECS - autoNextCount) / AUTONEXT_SECS) * 100;

  const handleNavigateEp = useCallback((url) => {
    if (!url) return;
    clearTimeout(autoNextRef.current);
    setIframeLoaded(false);
    setAutoNextCount(null);
    setServerIdx(0);
    navigate(`/watch/${id}?url=${encodeURIComponent(url)}&anime=${encodeURIComponent(animeUrl)}`, { state: { autoPlay: true } });
  }, [animeUrl, id, navigate]);

  // ── History ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (anime && episodeData && animeUrl) {
      // Ensure the anime object has the url for future navigation from history
      addToHistory({ ...anime, url: animeUrl }, episodeData.episode, episodeUrl);
    }
  }, [addToHistory, anime, episodeData, animeUrl, episodeUrl]);

  // ── Auto-select language & best server ────────────────────────────────────
  useEffect(() => {
    if (!episodeData?.variants) return;
    let targetLang = language;
    const hasDub = episodeData?.servers?.dub?.length > 0 || episodeData?.servers?.DUB?.length > 0;
    const hasSub = episodeData?.servers?.sub?.length > 0 || episodeData?.servers?.SUB?.length > 0;
    
    if (hasDub && !hasSub && language === 'sub') {
      targetLang = 'dub';
      setLanguage('dub');
    }
    if (hasSub && !hasDub && language === 'dub') {
      targetLang = 'sub';
      setLanguage('sub');
    }

    // Auto-select server that supports direct video (like PDrain)
    const availableServers = (() => {
      const s = episodeData.servers;
      if (!s) return [];
      if (Array.isArray(s)) return s;
      const direct = s[targetLang.toUpperCase()] || s[targetLang];
      if (direct?.length) return direct;
      const fb = s.LAT || s.lat || s.DUB || s.dub || s.SUB || s.sub;
      if (fb?.length) return fb;
      for (const val of Object.values(s)) {
        if (Array.isArray(val) && val.length > 0) return val;
      }
      return [];
    })();
    
    const bestIdx = availableServers.findIndex(srv => {
      const transformed = transformToDirectVideoUrl(srv.url || srv.code || '');
      return isDirectVideoUrl(transformed) || transformed.includes('pixeldrain.com/api/file/');
    });

    if (bestIdx === -1) {
      setServerIdx(0);
    } else {
      setServerIdx(bestIdx);
    }
  }, [episodeData, language]);

  useEffect(() => {
    setIframeLoaded(false);
    setAutoNextCount(null);
  }, [episodeUrl, language, serverIdx]);

  // ── Auto-next countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (autoNextCount === null) return;
    if (autoNextCount <= 0) {
      if (nextEp) handleNavigateEp(nextEp.url);
      return;
    }
    autoNextRef.current = setTimeout(() => setAutoNextCount(c => c - 1), 1000);
    return () => clearTimeout(autoNextRef.current);
  }, [autoNextCount, handleNavigateEp, nextEp]);

  const cancelAutoNext = () => {
    clearTimeout(autoNextRef.current);
    setAutoNextCount(null);
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingAnime || loadingEpisode) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
        <Loader2 className="absolute inset-0 m-auto animate-spin text-primary" size={40} />
      </div>
      <p className="font-display font-black text-2xl text-white italic tracking-widest animate-pulse uppercase">Sincronizando Servidores</p>
    </div>
  );

  if (errorEpisode) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center px-4">
      <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
        <AlertCircle size={40} />
      </div>
      <h2 className="text-2xl font-black text-white italic">Error de Transmisión</h2>
      <p className="text-text-secondary max-w-md mx-auto">No pudimos obtener los enlaces. Intenta recargar o selecciona otro servidor.</p>
      <button onClick={() => globalThis.location.reload()} className="primary-btn px-8 py-3">Reintentar</button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background-main pb-24 px-4 lg:px-8 animate-in fade-in duration-500">
      <Helmet>
        <title>{`Viendo: ${anime?.title || 'Episodio'} Episodio ${currentEpNum} - Zenkai Anime`}</title>
        <meta name="description" content={`Disfruta del episodio ${currentEpNum} de ${anime?.title || 'tu anime favorito'} con la mejor calidad en Zenkai Anime.`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-[1600px] mx-auto space-y-5 pt-4">

        {/* ── Top Bar ───────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all">
              <ChevronLeft size={22} />
            </button>
            <div>
              <button 
                onClick={() => navigate(`/anime/${(anime?.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-')}?url=${encodeURIComponent(animeUrl)}`)}
                className="font-display font-black text-white text-lg lg:text-xl italic uppercase tracking-tight truncate max-w-[220px] sm:max-w-sm hover:text-accent cursor-pointer transition-colors outline-none text-left"
                title="Volver a los detalles del anime"
              >
                {anime?.title}
              </button>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md uppercase tracking-[0.2em]">
                  Ep {episodeData?.episode}
                </span>
                <span className="text-[10px] font-black text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md uppercase tracking-[0.2em]">
                  {language === 'sub' ? 'Subtitulado' : 'Doblaje Latino'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {prevEp && (
              <button onClick={() => handleNavigateEp(prevEp.url)}
                className="secondary-btn py-2 px-4 text-[10px] uppercase tracking-widest hidden sm:flex items-center gap-2">
                <ChevronLeft size={14}/> Anterior
              </button>
            )}
            {nextEp && (
              <button onClick={() => handleNavigateEp(nextEp.url)}
                className="primary-btn py-2 px-4 text-[10px] uppercase tracking-widest hidden sm:flex items-center gap-2">
                Siguiente <ChevronRight size={14}/>
              </button>
            )}
            <button onClick={() => setShowEpList(v => !v)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all border ${
                showEpList ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}>
              <List size={20} />
            </button>
          </div>
        </div>

        {/* ── Player + Sidebar ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className={`space-y-5 transition-all duration-500 ${showEpList ? 'lg:col-span-9' : 'lg:col-span-12'}`}>

            {/* ── Video Container ─────────────────────────────────────────── */}
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl shadow-black/60 border border-white/5">

              {(() => {
                if (servers.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8 relative z-10">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/5">
                        <Info size={32} />
                      </div>
                      <p className="text-white font-black italic uppercase text-lg">Servidor no disponible</p>
                      <p className="text-text-secondary text-sm max-w-sm">No hay {language === 'sub' ? 'subtítulos' : 'doblaje'} o el episodio aún no está disponible en el servidor actual.</p>
                      <button 
                        onClick={() => navigate(`/anime/${(anime?.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-')}?url=${encodeURIComponent(animeUrl)}`)}
                        className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl transition-colors border border-white/10"
                      >
                        Volver al Anime
                      </button>
                    </div>
                  );
                }
                if (!hasStarted) {
                  return (
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group z-10 bg-black"
                      onClick={() => setHasStarted(true)}
                    >
                      <img 
                        src={anime?.backdrop || anime?.image || IMG_FALLBACK} 
                        className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" 
                        alt="Play Video"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/90 backdrop-blur-md rounded-full flex items-center justify-center relative z-20 shadow-[0_0_40px_rgba(var(--color-primary),0.5)] scale-95 group-hover:scale-110 transition-all duration-300">
                        <Play fill="white" size={36} className="ml-2 text-white" />
                      </div>
                      <p className="relative z-20 mt-6 text-white font-black italic uppercase tracking-widest text-sm md:text-base opacity-70 group-hover:opacity-100 transition-opacity">
                        Reproducir Episodio {episodeData?.episode}
                      </p>
                    </div>
                  );
                }
                
                if (directVideo) {
                  return (
                    <CustomVideoPlayer 
                      key={`${serverIdx}-${episodeUrl}-${language}`}
                      src={selectedServerUrl}
                      title={`${anime?.title || 'Anime'} - Episodio ${episodeData?.episode || ''}`}
                      poster={anime?.backdrop || anime?.image}
                      hasNextEpisode={!!nextEp}
                      onNextEpisode={() => { if(nextEp) handleNavigateEp(nextEp.url) }}
                      onAutoNext={() => {
                        if (nextEp && autoNextCount === null) setAutoNextCount(AUTONEXT_SECS);
                      }}
                      initialTime={initialTime}
                      onTimeUpdateCallback={(time) => {
                        if (time > 0 && time % 5 < 1) {
                          updateProgress(animeUrl, time);
                        }
                      }}
                    />
                  );
                }
                
                return (
                  <div className="relative w-full h-full">
                    <iframe
                      key={`${serverIdx}-${episodeUrl}-${language}`}
                      src={selectedServerUrl}
                      className="w-full h-full border-none"
                      allowFullScreen
                      title="Video Player"
                      onLoad={handleIframeLoad}
                    />
                  </div>
                );
              })()}



              {/* ── AUTO-NEXT OVERLAY — aparece al final del episodio ─────── */}
              {autoNextCount !== null && nextEp && (isTV ? (
                <div className="absolute inset-0 z-40 flex items-end justify-end p-8">
                  <div className="bg-black/85 backdrop-blur-xl border border-white/15 rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary">Siguiente Episodio</p>
                    <div className="flex items-center gap-4">
                      <img
                        src={anime?.image || IMG_FALLBACK}
                        onError={e => { e.target.src = IMG_FALLBACK; }}
                        className="w-16 h-24 object-cover rounded-xl border border-white/10 flex-shrink-0"
                        alt=""
                      />
                      <div>
                        <p className="text-white font-black text-sm uppercase tracking-tight line-clamp-2">{anime?.title}</p>
                        <p className="text-primary font-black text-xs mt-1">Episodio {nextEp.number}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleNavigateEp(nextEp.url)} className="flex-1 bg-primary text-white font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-xl">
                        Ir Ahora
                      </button>
                      <button onClick={cancelAutoNext} className="flex-1 bg-white/10 text-white font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-xl">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-40 flex items-end justify-end p-8"
                  >
                    <div className="bg-black/85 backdrop-blur-xl border border-white/15 rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary">Siguiente Episodio</p>

                      <div className="flex items-center gap-4">
                        <img
                          src={anime?.image || IMG_FALLBACK}
                          onError={e => { e.target.src = IMG_FALLBACK; }}
                          className="w-16 h-24 object-cover rounded-xl border border-white/10 flex-shrink-0"
                          alt=""
                        />
                        <div>
                          <p className="text-white font-black text-sm uppercase tracking-tight line-clamp-2">{anime?.title}</p>
                          <p className="text-primary font-black text-xs mt-1">Episodio {nextEp.number}</p>
                        </div>
                      </div>

                      {/* Barra de cuenta regresiva circular */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                              Inicia en {autoNextCount}s
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                              {Math.round(autoNextProgress)}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              className="h-full rounded-full bg-primary"
                              initial={false}
                              animate={{ width: `${autoNextProgress}%` }}
                              transition={{ duration: 1, ease: 'linear' }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 flex-shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                            <circle cx="28" cy="28" r="24" fill="none" stroke="#7c3aed" strokeWidth="4"
                              strokeDasharray={`${2 * Math.PI * 24}`}
                              strokeDashoffset={`${2 * Math.PI * 24 * (1 - autoNextCount / AUTONEXT_SECS)}`}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xl">{autoNextCount}</span>
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <button
                            onClick={() => handleNavigateEp(nextEp.url)}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                            <Play size={12} fill="white" /> Ir Ahora
                          </button>
                          <button
                            onClick={cancelAutoNext}
                            className="w-full flex items-center justify-center gap-2 bg-white/10 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-white/20 transition-colors">
                            <X size={12} /> Cancelar
                          </button>
                        </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ))}
            </div>

            {/* ── Controls Bar ───────────────────────────────────────────────── */}
            <div className="glass-card p-6 border-white/5 space-y-5">
              {/* Anime info + Language */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={anime?.image || IMG_FALLBACK}
                    onError={e => { e.target.src = IMG_FALLBACK; }}
                    className="w-14 aspect-[2/3] object-cover rounded-xl border border-white/10 shadow-xl"
                    alt=""
                  />
                  <div>
                    <h3 className="font-display font-black text-lg text-white italic uppercase tracking-tight line-clamp-1">{anime?.title}</h3>
                    <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mt-1">
                      Episodio {episodeData?.episode}
                      {anime?.year ? ` · ${anime.year}` : ''}
                      {anime?.type ? ` · ${anime.type}` : ''}
                    </p>
                  </div>
                </div>

                {/* Language toggle */}
                <div className="flex gap-2 p-1.5 bg-background-main/50 rounded-2xl border border-white/5">
                  {(episodeData?.servers?.sub?.length > 0 || episodeData?.servers?.SUB?.length > 0) && (
                    <button onClick={() => setLanguage('sub')}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] transition-all uppercase tracking-widest ${
                        language === 'sub' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-secondary hover:text-white'
                      }`}>
                      <Globe size={16} /> SUB
                    </button>
                  )}
                  {(episodeData?.servers?.dub?.length > 0 || episodeData?.servers?.DUB?.length > 0 || episodeData?.servers?.lat?.length > 0) && (
                    <button onClick={() => setLanguage('dub')}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] transition-all uppercase tracking-widest ${
                        language === 'dub' ? 'bg-accent text-background-main shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-white'
                      }`}>
                      <MessageCircle size={16} /> DUB LAT
                    </button>
                  )}
                </div>
              </div>

              {/* Server selector */}
              {servers.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                    <Server size={12} /> Servidores · {servers.length} disponibles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {servers.map((srv, i) => {
                      const isDirect = isDirectVideoUrl(transformToDirectVideoUrl(srv.url)) || transformToDirectVideoUrl(srv.url).includes('pixeldrain.com/api/file/');
                      return (
                        <button
                          key={srv.url || i}
                          onClick={() => setServerIdx(i)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                            serverIdx === i
                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                              : 'bg-white/5 border-white/10 text-text-secondary hover:text-white hover:border-white/20'
                          }`}
                        >
                          <Server size={11} />
                          {srv.name || srv.server || `Srv ${i + 1}`}
                          {srv.quality && <span className="ml-1 text-accent text-[9px]">{srv.quality}</span>}
                          {isDirect && <span className="ml-1 text-green-400 text-[9px]">(Nativo)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Episode Sidebar ────────────────────────────────────────────── */}
          <AnimatePresence>
            {showEpList && (() => {
              const EpSidebarTag = isTV ? 'div' : motion.div;
              const sidebarProps = isTV ? {} : {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: 20 }
              };
              const epsToRender = isTV ? paginatedEps : sorted;
              return (
                <EpSidebarTag
                  {...sidebarProps}
                  className="lg:col-span-3 h-[calc(100vh-200px)] sticky top-24 flex flex-col"
                >
                  <div className="glass-card p-5 border-white/5 h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="font-display font-black text-white italic uppercase text-base">Episodios</h4>
                      <span className="text-[9px] font-black text-primary border border-primary/20 px-2 py-1 rounded-md uppercase tracking-widest">
                        {anime?.episodes?.length} EP
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-2">
                      {epsToRender.map((ep, i) => {
                        const isActive = Number.parseFloat(ep.number) === currentEpNum;
                        return (
                          <button
                            key={ep.url || i}
                            onClick={() => handleNavigateEp(ep.url)}
                            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border ${
                              isActive
                                ? 'bg-primary/10 border-primary/30'
                                : 'bg-background-main/50 border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                              isActive ? 'bg-primary text-white' : 'bg-background-secondary text-text-secondary'
                            }`}>
                              {ep.number}
                            </div>
                            <p className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-white'}`}>
                              Ep {ep.number}
                            </p>
                            {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                          </button>
                        );
                      })}
                    </div>
                    {/* TV pagination for episode list */}
                    {isTV && totalEpPages > 1 && (
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                        <button
                          onClick={() => setEpPage(p => Math.max(0, p - 1))}
                          disabled={epPage === 0}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-white disabled:opacity-30 hover:bg-primary/20 transition-colors"
                        >
                          <ChevronsLeft size={14} /> Anterior
                        </button>
                        <span className="text-[9px] font-bold text-text-secondary">
                          {epPage * EP_PAGE_SIZE + 1}-{Math.min((epPage + 1) * EP_PAGE_SIZE, sorted.length)} / {sorted.length}
                        </span>
                        <button
                          onClick={() => setEpPage(p => Math.min(totalEpPages - 1, p + 1))}
                          disabled={epPage >= totalEpPages - 1}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-white disabled:opacity-30 hover:bg-primary/20 transition-colors"
                        >
                          Siguiente <ChevronsRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </EpSidebarTag>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Watch;
