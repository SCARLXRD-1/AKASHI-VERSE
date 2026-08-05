import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { animeService, proxyImage } from '../services/animeService';
import { useAnimeStore } from '../store/useAnimeStore';
import { Play, Star, Clock, Info, ChevronRight, Bookmark, AlertCircle, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import AnimeCard from '../components/cards/AnimeCard';
import { AnimeDetailSkeleton } from '../components/ui/Skeleton';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'%3E%3Crect width='400' height='600' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff20' font-size='80' font-family='sans-serif'%3E%E2%96%B6%3C/text%3E%3C/svg%3E";

const RelationCard = ({ relation }) => {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['relationSearch', relation.title],
    queryFn: () => animeService.searchAnime(relation.title, { limit: 1 }),
    staleTime: 1000 * 60 * 60,
  });

  const animeMatch = data?.[0] || null;
  const imageToUse = animeMatch ? proxyImage(animeMatch.image) : IMG_FALLBACK;
  
  const handleClick = () => {
    if (animeMatch) {
      const slug = (animeMatch.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      navigate(`/anime/${slug}?url=${encodeURIComponent(animeMatch.url)}`);
    } else {
      alert("Esta secuela o saga no se encuentra actualmente en el catálogo de proveedores.");
    }
  };

  const relLabel = relation.relation === 'Sequel' ? 'Secuela' : 
                   relation.relation === 'Prequel' ? 'Precuela' :
                   relation.relation === 'Side story' ? 'Historia Extra' :
                   relation.relation === 'Alternative setting' ? 'Alt Setting' :
                   relation.relation === 'Alternative version' ? 'Versión Alt' :
                   relation.relation === 'Spin-off' ? 'Spin-off' : relation.relation;

  return (
    <motion.button
      whileHover={{ y: -5 }}
      onClick={handleClick}
      className="flex items-center gap-4 p-3 pr-4 rounded-2xl bg-background-secondary border border-white/5 hover:border-accent/40 group text-left transition-all w-full relative overflow-hidden shadow-lg shadow-black/20"
    >
      <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-background-main relative">
        <img 
          src={imageToUse} 
          alt={relation.title}
          onError={(e) => { e.target.src = IMG_FALLBACK; }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-1.5 left-0 right-0 text-center text-[7px] font-black uppercase text-accent leading-none tracking-widest drop-shadow-md px-1">
          {relLabel}
        </div>
      </div>
      <div className="flex-1 min-w-0 py-1">
        <h4 className="text-white font-bold text-sm line-clamp-2 leading-tight group-hover:text-accent transition-colors">{relation.title}</h4>
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-2 flex items-center gap-1">
          {animeMatch ? 'Ver Archivo' : 'Buscando...'}
        </p>
      </div>
      <ChevronRight size={16} className="text-white/20 group-hover:text-accent group-hover:translate-x-1 transition-transform shrink-0" />
    </motion.button>
  );
};

const AnimeDetail = () => {
  const [searchParams] = useSearchParams();
  const animeUrl = searchParams.get('url');
  const navigate = useNavigate();
  const { toggleFavorite, favorites, history } = useAnimeStore();

  const { data: anime, isLoading, error } = useQuery({
    queryKey: ['anime', animeUrl],
    queryFn: () => animeService.getAnimeById(animeUrl),
    enabled: !!animeUrl,
  });

  // Find watched history for this anime
  const historyItem = history.find(h => h.url === animeUrl);
  const lastWatchedEp = historyItem?.lastEpisode ? Number.parseFloat(historyItem.lastEpisode) : 0;

  // Related animes query (search by first genre)
  const firstGenre = anime?.genres?.[0]?.name;
  const { data: relatedAnimes } = useQuery({
    queryKey: ['related', firstGenre],
    queryFn: () => animeService.searchAnime(firstGenre, { limit: 8 }),
    enabled: !!firstGenre,
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) return <AnimeDetailSkeleton />;

  if (error || !anime) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center px-4">
      <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
        <AlertCircle size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white italic">Error de Datos</h2>
        <p className="text-text-secondary max-w-md mx-auto">No pudimos encontrar la información de este anime. Es posible que el enlace haya expirado o el servidor esté caído.</p>
      </div>
      <button onClick={() => navigate(-1)} className="primary-btn px-8 py-3">Volver Atrás</button>
    </div>
  );

  const isFavorite = favorites.some(f => f.url === animeUrl);

  // Normalize numeric/raw status codes from the API to human-readable labels
  const STATUS_LABELS = {
    '1': 'En emisión', 'on_air': 'En emisión', 'airing': 'En emisión', 'on air': 'En emisión',
    'en emisión': 'En emisión', 'en emision': 'En emisión', 'en emisiÓn': 'En emisión',
    '2': 'Finalizado', 'complete': 'Finalizado', 'completed': 'Finalizado',
    'finalizado': 'Finalizado', 'finished': 'Finalizado',
    '3': 'Próximamente', 'upcoming': 'Próximamente', 'proximamente': 'Próximamente', 'próximamente': 'Próximamente',
  };
  const normalizeStatus = (val) => {
    if (!val || String(val).trim() === '' || String(val).trim() === 'null') return null;
    return STATUS_LABELS[String(val).toLowerCase().trim()] || String(val);
  };

  const TYPE_LABELS = {
    'tv anime': 'Anime TV', 'tv': 'Anime TV', 'anime': 'Anime TV',
    'movie': 'Película', 'pelicula': 'Película',
    'ova': 'OVA', 'ona': 'ONA', 'special': 'Especial',
  };
  const normalizeType = (val) => {
    if (!val) return null;
    return TYPE_LABELS[String(val).toLowerCase().trim()] || String(val);
  };

  const displayStatus = normalizeStatus(anime.status);
  const displayType = normalizeType(anime.type);
  const displayScore = anime.score && Number.parseFloat(anime.score) > 0 ? anime.score : null;
  const displayYear = anime.year || anime.url?.match(/(\d{4})/)?.[1];

  const handleWatch = (episode) => {
    const epUrl = episode.url;
    navigate(`/watch/${anime.id || 'current'}?url=${encodeURIComponent(epUrl)}&anime=${encodeURIComponent(animeUrl)}`);
  };

  // Progress tracking
  const totalEps = anime?.episodes?.length || 0;
  const watchedCount = lastWatchedEp > 0 ? Math.min(Math.floor(lastWatchedEp), totalEps) : 0;
  const progressPercent = totalEps > 0 ? Math.round((watchedCount / totalEps) * 100) : 0;
  
  const sortedEps = [...(anime?.episodes || [])].sort((a, b) => Number.parseFloat(a.number) - Number.parseFloat(b.number));
  const nextEpToWatch = sortedEps.find(ep => Number.parseFloat(ep.number) > lastWatchedEp) || sortedEps[0];
  const hasStartedWatching = lastWatchedEp > 0;

  return (
    <div className="min-h-screen bg-background-main pb-32">
      <Helmet>
        <title>{anime.title} - Zenkai Anime</title>
        <meta name="description" content={anime.synopsis?.slice(0, 160) || `Ver ${anime.title} en HD sin anuncios.`} />
        <meta property="og:title" content={`${anime.title} - Zenkai Anime`} />
        <meta property="og:image" content={anime.cover || anime.poster} />
      </Helmet>

      {/* Hero Banner with Backdrop */}
      <div className="relative h-[60vh] lg:h-[75vh] w-full overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img 
            src={proxyImage(anime.backdrop || anime.image) || IMG_FALLBACK} 
            alt={anime.title}
            onError={e => {
              const fallback = proxyImage(anime.image);
              if (fallback && e.target.src !== fallback) e.target.src = fallback;
              else e.target.src = IMG_FALLBACK;
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background-main via-background-main/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background-main via-transparent to-transparent z-10" />
        </motion.div>

        {/* Content Overlay */}
        <div className="absolute inset-0 z-20 flex items-end pb-12 lg:pb-24">
          <div className="container px-4 lg:px-12 flex flex-col lg:flex-row gap-12 items-end">
             {/* Poster */}
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               className="hidden lg:block w-72 aspect-[2/3] rounded-[2.5rem] overflow-hidden border-4 border-white/5 shadow-2xl shadow-black shadow-primary/10"
             >
               <img 
                 src={proxyImage(anime.image) || IMG_FALLBACK} 
                 onError={e => { e.target.src = IMG_FALLBACK; }}
                 className="w-full h-full object-cover" 
                 alt="" 
               />
             </motion.div>

             {/* Info */}
             <div className="flex-1 space-y-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-wrap items-center gap-3"
                >
                  {displayScore && (
                    <div className="flex items-center gap-1.5 bg-accent/20 backdrop-blur-md border border-accent/30 px-3 py-1 rounded-lg">
                      <Star size={14} className="text-accent fill-accent" />
                      <span className="text-accent text-[11px] font-black">{displayScore} RATING</span>
                    </div>
                  )}
                  <span className="text-white/60 font-black text-[10px] uppercase tracking-widest">{[displayYear, displayType, displayStatus].filter(Boolean).join(' • ')}</span>
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] uppercase tracking-tight italic py-2 line-clamp-4"
                >
                  {anime.title}
                </motion.h1>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-2"
                >
                  {anime.genres?.map(genre => (
                    <span key={genre.name} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-text-secondary text-[10px] font-bold uppercase tracking-widest hover:border-primary transition-colors cursor-default">
                      {genre.name}
                    </span>
                  ))}
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-4 pt-6"
                >
                  <button 
                    onClick={() => handleWatch(nextEpToWatch)}
                    disabled={!anime.episodes?.length}
                    className="primary-btn px-10 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 group disabled:opacity-50"
                  >
                    <Play size={18} fill="white" className="group-hover:scale-110 transition-transform" />
                    {hasStartedWatching ? `Continuar Ep. ${Math.ceil(lastWatchedEp) + 1}` : 'Ver Episodio 1'}
                  </button>
                  <button 
                    onClick={() => toggleFavorite(anime)}
                    className={`secondary-btn px-8 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all ${isFavorite ? 'bg-primary border-primary text-white' : ''}`}
                  >
                    <Bookmark size={18} fill={isFavorite ? 'white' : 'none'} /> {isFavorite ? 'En Mi Lista' : 'Guardar'}
                  </button>
                </motion.div>
             </div>
          </div>
        </div>
      </div>

      {/* Details & Episodes */}
      <div className="container px-4 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Column: Synopsis */}
        <div className="lg:col-span-8 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                 <Info size={20} />
               </div>
               <h2 className="font-display text-2xl font-black text-white italic uppercase">Sinopsis</h2>
            </div>
            <p className="text-text-secondary text-lg font-medium leading-relaxed max-w-4xl">
              {anime.description || 'No hay descripción disponible para este título.'}
            </p>

            {/* Progress Bar */}
            {hasStartedWatching && totalEps > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background-secondary/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-white/60">
                    Progreso de serie
                  </span>
                  <span className="text-xs font-black text-primary">
                    {progressPercent}% completado
                  </span>
                </div>
                <div className="relative w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #7C3AED, #00E5FF)' }}
                  />
                </div>
                <p className="text-[11px] font-bold text-text-secondary">
                  Episodio {watchedCount} de {totalEps} — Último visto: Ep. {lastWatchedEp}
                </p>
              </motion.div>
            )}
          </section>

          {/* Episode List */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
                   <Play size={20} />
                 </div>
                 <h2 className="font-display text-2xl font-black text-white italic uppercase">Episodios</h2>
              </div>
              <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
                {anime.episodes?.length || 0} Total
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {anime.episodes?.map((ep, i) => (
                 <motion.button
                   key={ep.number || i}
                   whileHover={{ x: 10 }}
                   onClick={() => handleWatch(ep)}
                   className={`flex items-center gap-6 p-5 rounded-3xl border transition-all group text-left ${
                      Number.parseFloat(ep.number) <= lastWatchedEp
                        ? 'bg-primary/5 border-primary/20 hover:border-primary/40'
                        : 'bg-background-secondary border-white/5 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                 >
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl italic transition-colors ${
                      Number.parseFloat(ep.number) <= lastWatchedEp
                        ? 'bg-primary/20 text-primary'
                        : 'bg-background-main text-white group-hover:bg-primary group-hover:text-white'
                    }`}>
                      {Number.parseFloat(ep.number) <= lastWatchedEp ? (
                        <CheckCircle2 size={22} className="text-primary" />
                      ) : (
                        ep.number
                      )}
                   </div>
                   <div className="flex-1">
                     <p className={`font-black uppercase text-sm transition-colors ${
                        Number.parseFloat(ep.number) <= lastWatchedEp ? 'text-primary/70' : 'text-white group-hover:text-primary'
                      }`}>
                        Episodio {ep.number}
                        {Number.parseFloat(ep.number) <= lastWatchedEp && (
                          <span className="ml-2 text-[9px] font-bold text-primary/50 normal-case tracking-wider">Visto</span>
                        )}
                     </p>
                     <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-widest opacity-50">Calidad Full HD</p>
                   </div>
                   <ChevronRight size={18} className="text-white/20 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                 </motion.button>
               ))}
            </div>
          </section>
        </div>

        {/* Right Column: Stats & Side Info */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass-card p-8 border-white/5 space-y-8">
              <h3 className="font-display font-black text-white italic uppercase tracking-widest text-sm border-b border-white/5 pb-4">Detalles del Archivo</h3>
              
              <div className="space-y-6">
                {(() => {
                const episodeCount = anime.totalEpisodes
                  ? `${anime.totalEpisodes} episodios`
                  : (anime.episodes?.length ? `${anime.episodes.length} episodios` : null);
                return [
                  { label: 'Estado', value: displayStatus, icon: Clock },
                  { label: 'Tipo', value: displayType, icon: Info },
                  { label: 'Año', value: displayYear, icon: Star },
                  { label: 'Episodios', value: episodeCount, icon: Play },
                  { label: 'Título Japonés', value: anime.titleJapanese, icon: Info },
                ].map((stat) => {
                  if (!stat.value) return null;
                  return (
                    <div key={stat.label} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                         <stat.icon size={12} />
                         {stat.label}
                      </div>
                      <p className="text-white font-bold text-sm break-words">{stat.value}</p>
                    </div>
                  );
                });
                })()}
              </div>
           </div>

           <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 space-y-4">
              <h4 className="font-display font-black text-white italic">¿Te gusta Zenkai?</h4>
              <p className="text-text-secondary text-xs font-medium">Comparte esta serie con tus amigos y ayúdanos a expandir el universo.</p>
              <button className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                Compartir Ahora
              </button>
           </div>
        </div>
      </div>

      {/* Franchise / More Seasons */}
      {anime.relations && anime.relations.length > 0 && (
        <div className="container px-4 lg:px-12 pb-12 pt-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
              <Layers size={20} />
            </div>
            <h2 className="font-display text-2xl font-black text-white italic uppercase">Sagas y Secuelas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {anime.relations.map((rel, i) => (
              <RelationCard key={rel.malId || i} relation={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Related Animes */}
      {relatedAnimes && relatedAnimes.length > 1 && (
        <div className="container px-4 lg:px-12 pb-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Sparkles size={20} />
            </div>
            <h2 className="font-display text-2xl font-black text-white italic uppercase">También Te Puede Gustar</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
            {relatedAnimes
              .filter(a => a.url !== animeUrl)
              .slice(0, 6)
              .map((a, i) => (
                <AnimeCard key={a.url || i} anime={a} index={i} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimeDetail;
