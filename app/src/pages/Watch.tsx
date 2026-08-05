import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { animeApi, peliApi } from '../lib/api'
import VideoPlayer from '../components/VideoPlayer'
import { useHistory } from '../hooks/useHistory'
import { useAutoplay } from '../hooks/useAutoplay'
import type { HistoryEntry } from '../types'
import { imageProxy } from '../lib/api'
import { isRealStream } from '../lib/proxy'
import { normalizeSeasons } from '../lib/seasons'
import Recommendations from '../components/Recommendations'

interface StreamInfo {
  src: string
  referer?: string
  server?: string
}

function extractServerList(data: unknown): Array<{ server?: string; name?: string; embedUrl?: string; url?: string; language?: string }> {
  if (Array.isArray(data)) return data as Array<{ server?: string; name?: string; embedUrl?: string; url?: string; language?: string }>
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.servers)) return obj.servers as Array<{ server?: string; name?: string; embedUrl?: string; url?: string; language?: string }>
    if (Array.isArray(obj.results)) return obj.results as Array<{ server?: string; name?: string; embedUrl?: string; url?: string; language?: string }>
    if (Array.isArray(obj.links)) return obj.links as Array<{ server?: string; name?: string; embedUrl?: string; url?: string; language?: string }>
  }
  return []
}

// Ordena servidores
function sortByLanguage<T extends { language?: string; name?: string }>(servers: T[], kind: string, preferredLang?: string): T[] {
  const isAnime = kind === 'anime'
  const isPrefDub = preferredLang === 'DUB'
  const isPrefSub = preferredLang === 'SUB'

  const priority = (s: T): number => {
    const lang = (s.language || s.name || '').toLowerCase()
    const isSub = lang.includes('sub') || lang.includes('subtitulado')
    const isLatino = lang.includes('latino') || lang.includes('lat') || lang.includes('dub')
    const isEspanol = lang.includes('español') || lang.includes('espanol') || lang.includes('spanish') || lang.includes('castellano')
    
    if (isAnime) {
      if (isPrefDub) {
        if (isLatino) return 0
        if (isEspanol) return 1
        if (isSub) return 2
        return 3
      } else if (isPrefSub) {
        if (isSub) return 0
        if (isLatino) return 1
        if (isEspanol) return 2
        return 3
      } else {
        // default priority
        if (isSub) return 0
        if (isLatino) return 1
        if (isEspanol) return 2
        return 3
      }
    } else {
      if (isLatino) return 0
      if (isEspanol) return 1
      if (isSub) return 3
      return 2
    }
  }
  return [...servers].sort((a, b) => priority(a) - priority(b))
}

export default function Watch() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { save } = useHistory()
  const didSave = useRef(false)

  const rawKind = params.get('kind') || params.get('type') || 'anime'
  const kind = rawKind === 'serie' ? 'series' : rawKind
  const slug = params.get('slug') || ''
  const season = Number(params.get('temporada') || 1)
  const episode = Number(params.get('episodio') || params.get('episode') || 1)
  const animeUrl = params.get('animeUrl') || ''
  const animeEpisodeUrl = params.get('url') || ''
  const preferredLang = params.get('lang') || undefined
  const title = params.get('titulo') || 'Reproduciendo'
  const poster = params.get('poster') || undefined

  const [nextUrl, setNextUrl] = useState(() => {
    const raw = params.get('nextUrl') || ''
    return raw.startsWith('/ver') ? raw.slice(4) : raw
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [serverIndex, setServerIndex] = useState(0)
  
  // Nuevos estados para Native Player
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)

  const [serverOptions, setServerOptions] = useState<Array<{ name?: string; language?: string; quality?: string; embedUrl?: string; server?: string; url?: string }>>([])
  
  const serversByLanguage = useMemo(() => {
    const groups: Record<string, Array<typeof serverOptions[0] & { originalIndex: number }>> = {}
    serverOptions.forEach((s, idx) => {
      const lang = s.language || (kind === 'anime' ? 'Japonés' : 'Subtitulado')
      if (!groups[lang]) groups[lang] = []
      groups[lang].push({ ...s, originalIndex: idx })
    })
    return groups
  }, [serverOptions, kind])

  const availableLanguages = Object.keys(serversByLanguage)
  const currentLang = serverOptions[serverIndex]?.language || (kind === 'anime' ? 'Japonés' : 'Subtitulado')

  // Evitar error de variable no usada para series/peliculas
  void availableLanguages
  void currentLang

  const [animeEpisodes, setAnimeEpisodes] = useState<Array<{ number?: number; url?: string; title?: string }>>([])
  const [serieSeasons, setSerieSeasons] = useState<any[]>([])
  const [selectedSeason, setSelectedSeason] = useState(season)

  const startAt = useMemo(() => {
    const t = Number(params.get('t') || 0)
    return Number.isFinite(t) && t > 0 ? t : 0
  }, [params])

  const watchId = useMemo(() => {
    const base = kind === 'anime' ? animeEpisodeUrl : `${slug}:${season}:${episode}`
    return `watch:${kind}:${base}`
  }, [kind, animeEpisodeUrl, slug, season, episode])


  const loadServers = useCallback(async () => {
    try {
      if (kind === 'anime') {
        if (!animeEpisodeUrl) throw new Error('Falta URL del episodio (Anime)')
        const payload = await animeApi.episodeLinks(animeEpisodeUrl)
        const data = (payload?.data ?? payload ?? {}) as Record<string, any>
        
        // Combine SUB and DUB links from servers/streamLinks
        const subLinks = Array.isArray(data?.streamLinks?.SUB) ? data.streamLinks.SUB : 
                        Array.isArray(data?.servers?.sub) ? data.servers.sub : []
        let dubLinks = Array.isArray(data?.streamLinks?.DUB) ? data.streamLinks.DUB : 
                        Array.isArray(data?.servers?.dub) ? data.servers.dub : []

        // Desactivamos AnimeAV1 dublinks para que el proveedor sea estrictamente JKAnime (solo subs).
        if (kind === 'anime') {
          dubLinks = []
        }

        const allLinks = [
          ...subLinks.map((l: any) => ({ ...l, detectedLang: 'Subtitulado' })),
          ...dubLinks.map((l: any) => ({ ...l, detectedLang: 'Español Latino' }))
        ]
        
        if (allLinks.length > 0) {
          const servers = allLinks.map(l => {
            const isImplicitDub = l.server?.toLowerCase().includes('dub') || l.server?.toLowerCase().includes('lat')
            return {
              name: l.server,
              language: isImplicitDub ? 'Español Latino' : l.detectedLang,
              embedUrl: l.url,
              server: l.server
            }
          })
          const sortedServers = sortByLanguage(servers, kind, preferredLang)
          setServerOptions(sortedServers)
          return sortedServers
        }
        
        // CASCADE A PELIAPI
        console.log('[WATCH] Anime1v failed or exhausted, cascading to peliApi by title...')
        const rawServers = extractServerList(await peliApi.servers(title, season, episode, title))
        
        // Para Animes no eliminamos el Latino, simplemente los mostramos como secundarios
        const servers = sortByLanguage(rawServers, kind, preferredLang)
        setServerOptions(servers)
        return servers
      }

      // Peliculas / Series
      const rawServers =
        kind === 'movie'
          ? extractServerList((await peliApi.info(slug, 'movie')).servers)
          : extractServerList(await peliApi.servers(slug, season, episode, title, animeEpisodeUrl || undefined))
      
      const servers = sortByLanguage(rawServers, kind, preferredLang)
      setServerOptions(servers)
      return servers
    } catch (e) {
      console.error('loadServers error', e)
      return []
    }
  }, [kind, animeEpisodeUrl, slug, season, episode, title])

  const resolveSelectedServer = useCallback(async () => {
    const s = serverOptions[serverIndex]
    if (!s) return
    
    setResolving(true)
    setResolveError(null)
    setStreamInfo(null)

    try {
      if (s.embedUrl) {
        let directUrl: string | undefined = undefined;
        let serverName = s.name || s.server;

        if (kind === 'anime') {
          const resolved = await animeApi.resolve(s.embedUrl)
          if (resolved?.streamUrl) {
            directUrl = resolved.streamUrl
            if (resolved.server) serverName = resolved.server
          }
        } else {
          directUrl = await peliApi.resolve(s.embedUrl)
        }

        if (directUrl && isRealStream(directUrl, s.embedUrl)) {
          setStreamInfo({ src: directUrl, server: serverName })
          setResolving(false)
          return
        }
      } else if (s.url && isRealStream(s.url)) {
        setStreamInfo({ src: s.url, server: s.name || s.server })
        setResolving(false)
        return
      }

      // Si no es directo ni resoluble con extractores estandar, intentamos preflight si es PeliApi
      if (s.embedUrl && (s.embedUrl.includes('cuevana') || s.embedUrl.includes('pelis'))) {
         const payload = {
            url: s.embedUrl,
            slug,
            kind: kind === 'series' || kind === 'serie' ? 'series' : kind,
            season,
            episode,
            title
         }
         const pf = await peliApi.preflight(payload)
         if (pf?.servers && pf.servers.length > 0) {
            const firstGood = pf.servers.find(srv => srv.directUrl)
            if (firstGood?.directUrl) {
              setStreamInfo({ src: firstGood.directUrl, server: firstGood.name })
              setResolving(false)
              return
            }
         }
      }

      setResolveError('El proveedor bloqueó la extracción de este servidor.')
    } catch (err) {
      console.error('resolveSelectedServer error', err)
      setResolveError('Ocurrió un error al intentar extraer el video.')
    } finally {
      setResolving(false)
    }
  }, [serverIndex, serverOptions, kind, season, episode, title, slug])

  useEffect(() => {
    resolveSelectedServer()
  }, [resolveSelectedServer])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    loadServers().then((servers) => {
      if (!mounted) return
      if (!servers || servers.length === 0) {
        setError('No se encontraron servidores para este contenido.')
      }
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [loadServers, watchId])

  // Calcula dinámicamente el siguiente episodio (anime o serie) para el autoplay.
  // No confía en el param `nextUrl` (que solo cubría un salto y rompía el formato del anime).
  useEffect(() => {
    let mounted = true
    const computeNext = async () => {
      try {
        if (kind === 'anime') {
          const payload = await animeApi.info(animeUrl || slug)
          const info = (payload?.data ?? payload ?? {}) as Record<string, any>

          if (info.episodes && info.episodes.length > 0) {
            const sortedEps = [...info.episodes].sort((a, b) => (a.number || 0) - (b.number || 0))
            if (mounted) setAnimeEpisodes(sortedEps)
          }
          if (info.seasons && info.seasons.length > 0) {
            if (mounted) setSerieSeasons(info.seasons)
          }

          if (!animeUrl || !animeEpisodeUrl) return
          const rawEpisodes = Array.isArray(info.episodes)
            ? (info.episodes as Array<{ number?: number; url?: string; title?: string }>)
            : []
          const uniqueEpisodes: typeof rawEpisodes = [];
          const seenNums = new Set();
          for (const ep of rawEpisodes) {
            const num = ep.number;
            if (num != null) {
              if (seenNums.has(num)) continue;
              seenNums.add(num);
            } else {
              if (ep.url && seenNums.has(ep.url)) continue;
              if (ep.url) seenNums.add(ep.url);
            }
            uniqueEpisodes.push(ep);
          }
          const idx = uniqueEpisodes.findIndex((e) => e.url === animeEpisodeUrl)
          const next = idx >= 0 ? uniqueEpisodes[idx + 1] : undefined
          if (!next?.url) return
          const qs = new URLSearchParams({ kind: 'anime', animeUrl, url: next.url, titulo: title })
          if (poster) qs.set('poster', poster)
          if (mounted) setNextUrl(`?${qs.toString()}`)
          return
        }

        if (kind === 'series' || kind === 'serie') {
          if (!slug) return
          const raw = await peliApi.info(slug, 'serie')
          const seasons = normalizeSeasons(raw?.seasons)
          if (mounted) {
            setSerieSeasons(seasons)
            setSelectedSeason(season)
          }
          const currentSeason = seasons.find((s) => s.season === season)
          if (!currentSeason) return
          const episodes = currentSeason.episodes
          const idx = episodes.findIndex((e) => e.number === episode)
          let nextSeasonNum = season
          let nextEp = idx >= 0 ? episodes[idx + 1] : undefined
          if (!nextEp) {
            const following = seasons.find((s) => s.season === season + 1)
            if (following?.episodes?.length) {
              nextSeasonNum = following.season
              nextEp = following.episodes[0]
            }
          }
          if (!nextEp) return
          const qs = new URLSearchParams({
            kind: 'serie',
            slug,
            tipo: 'serie',
            temporada: String(nextSeasonNum),
            episodio: String(nextEp.number),
            titulo: title,
          })
          if (poster) qs.set('poster', poster)
          if (nextEp.url) qs.set('url', nextEp.url)
          if (mounted) setNextUrl(`?${qs.toString()}`)
        }
      } catch {
        /* sin siguiente episodio */
      }
    }
    void computeNext()
    return () => {
      mounted = false
    }
  }, [kind, animeUrl, animeEpisodeUrl, slug, season, episode, title, poster])

  // Playback failure: intenta el siguiente servidor automáticamente.
  const handlePlaybackFailure = useCallback(() => {
    const nextIdx = serverIndex + 1
    if (nextIdx < serverOptions.length) {
      console.log(`[WATCH] onFatal → auto-switching to server ${nextIdx}`)
      setServerIndex(nextIdx)
    } else {
      setError('No se pudo reproducir con ningún servidor disponible. Puedes intentar recargar la página.')
    }
  }, [serverIndex, serverOptions.length])

  const autoTriggered = useRef(false)
  useEffect(() => {
    autoTriggered.current = false
  }, [slug, episode, season])

  const goNext = useCallback(() => {
    if (nextUrl) {
      navigate(`/ver${nextUrl}`)
    } else {
      navigate(-1)
    }
  }, [nextUrl, navigate])

  const { remaining, trigger, cancel, playNext } = useAutoplay({
    countdown: 10,
    onNext: goNext,
    enabled: Boolean(nextUrl),
  })

  const onProgress = useCallback(
    (current: number, duration: number) => {
      if (duration === 0) return
      if (!didSave.current && current > 0 && current < duration - 5) {
        didSave.current = true
      }
      
      // Activar Siguiente Episodio automático a 10s del final
      if (duration > 0 && current >= duration - 10 && nextUrl && !autoTriggered.current) {
        autoTriggered.current = true
        trigger()
      }
      const entry: HistoryEntry = {
        id: watchId,
        kind: kind as HistoryEntry['kind'],
        title,
        poster,
        provider: serverOptions[serverIndex]?.server || serverOptions[serverIndex]?.name || 'akashi',
        episode: kind !== 'movie' ? `E${episode}` : undefined,
        season,
        episodeNumber: kind !== 'movie' ? episode : undefined,
        progress: current,
        duration,
        timestamp: Date.now(),
        watchUrl: window.location.search,
        nextUrl: nextUrl || undefined,
      }
      save(entry)
    },
    [watchId, kind, title, poster, serverOptions, serverIndex, episode, season, nextUrl, save, trigger],
  )

  const onEnded = useCallback(() => {
    if (nextUrl && !autoTriggered.current) trigger()
  }, [nextUrl, trigger])

  const posterSrc = kind === 'anime' && poster ? imageProxy(poster) : poster

  if (loading) {
    return (
      <div className="main">
        <div style={{ marginBottom: 12 }}>
          <span className="kicker">{kind === 'anime' ? 'Anime' : kind === 'movie' ? 'Película' : 'Serie'}</span>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '1.3rem', marginTop: 6 }}>{title}</h1>
        </div>
        <div className="player-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {posterSrc ? (
            <img src={posterSrc} alt={title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)' }} />
          )}
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="spinner" role="status" aria-label="Cargando" />
            <p style={{ color: '#fff', fontSize: '0.9rem', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              Cargando reproducción…
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error || serverOptions.length === 0) {
    return (
      <div className="main">
        <div style={{ marginBottom: 12 }}>
          <span className="kicker">{kind === 'anime' ? 'Anime' : kind === 'movie' ? 'Película' : 'Serie'}</span>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '1.3rem', marginTop: 6 }}>{title}</h1>
        </div>
        <div className="player-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {posterSrc ? (
            <img src={posterSrc} alt={title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)' }} />
          )}
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20 }}>
            <div className="error-box" style={{ background: 'rgba(0,0,0,0.7)', maxWidth: 500 }}>
              <h3>Error al cargar los servidores</h3>
              <p>{error}</p>
              {serverOptions.length > 1 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>Selecciona otro servidor:</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {serverOptions.map((s, i) => (
                      <button
                        key={`${i}-${s.server}`}
                        className={`season-tab ${i === serverIndex ? 'active' : ''}`}
                        data-nav
                        onClick={() => {
                          setError(null)
                          setServerIndex(i)
                        }}
                      >
                        {`Servidor ${i + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                <button className="btn btn-primary" data-nav onClick={() => { setError(null); setServerIndex(0); setLoading(true) }} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                  Reintentar
                </button>
                <button className="btn btn-ghost" data-nav onClick={() => navigate(-1)}>
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        <span className="kicker">{kind === 'anime' ? 'Anime' : kind === 'movie' ? 'Película' : 'Serie'}</span>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: '1.3rem', marginTop: 6 }}>{title}</h1>
      </div>

      <div className="watch-layout">
        <div className="watch-player-col">
          <div className="player-wrap" style={{ position: 'relative' }}>
            {resolving ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400, backgroundColor: '#000', color: 'white' }}>
                <span className="loader" style={{ marginBottom: 16 }}></span>
                <p>Extrayendo video sin anuncios...</p>
              </div>
            ) : resolveError ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400, backgroundColor: '#000', color: 'var(--danger)' }}>
                <p>{resolveError}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: 8 }}>Intenta seleccionando otro servidor abajo.</p>
              </div>
            ) : (
              <>
                <VideoPlayer
                src={streamInfo?.src || ''}
                referer={streamInfo?.referer}
                poster={posterSrc}
                startAt={startAt}
                onProgress={onProgress}
                onEnded={onEnded}
                onFatal={handlePlaybackFailure}
                />
                {remaining !== null && (
                <div className="autoplay-card">
                  <div className="next-meta">
                    {posterSrc && <img className="next-poster" src={posterSrc} alt="" loading="lazy" />}
                    <div>
                      <h4>Siguiente episodio</h4>
                      <p>
                        Reproduciendo en <span className="autoplay-count">{remaining}s</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" data-nav onClick={playNext} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                      ▶ Reproducir
                    </button>
                    <button className="btn btn-ghost" data-nav onClick={cancel} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
                )}
              </>
            )}
          </div>

          {serverOptions.length > 0 && (
            <div className="server-selector-container" style={{ marginTop: 16, border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface)' }}>
              <div className="server-alert" style={{ background: 'var(--accent-soft)', color: 'var(--text)', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
                <span>✨ Reproductor Nativo de AkashiVerse: Alta calidad y sin ventanas emergentes.</span>
              </div>
              
              {/* Server Options */}
              <div className="w-full">
                {kind === 'anime' ? (
                  // Solo mostrar los servidores para anime sin pestañas de idioma (todo subtitulado)
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-2 bg-[var(--color-surface)] p-2 rounded-xl border border-[var(--color-primary-dim)]">
                      {serverOptions.map((s, idx) => (
                        <button
                          key={idx}
                          className={`btn ${idx === serverIndex ? 'btn-primary shadow-lg ring-2 ring-[var(--color-primary)]' : 'btn-ghost'}`}
                          onClick={() => setServerIndex(idx)}
                        >
                          <span className="truncate">{s.name || s.server || 'Server ' + (idx + 1)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Para películas y series se mantienen los idiomas
                  Object.entries(serversByLanguage).map(([lang, srvs]) => (
                    <div key={lang} className="mb-4">
                      <div className="w-full text-center py-2 bg-[var(--color-primary)] text-white rounded-t-xl font-bold">
                        {lang}
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-[var(--color-surface)] p-2 rounded-b-xl border border-[var(--color-primary-dim)]">
                        {srvs.map((s, i) => (
                          <button
                            key={i}
                            className={`btn ${s.originalIndex === serverIndex ? 'btn-primary shadow-lg ring-2 ring-[var(--color-primary)]' : 'btn-ghost'}`}
                            onClick={() => setServerIndex(s.originalIndex)}
                          >
                            <span className="truncate">{s.name || s.server || 'Server ' + (s.originalIndex + 1)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--muted)' }}>
            {serverOptions[serverIndex]?.server && `Servidor: ${serverOptions[serverIndex]?.server || serverOptions[serverIndex]?.name}`} · El historial ahora guarda tu último episodio.
          </p>
        </div>

        {/* Sidebar for Anime */}
        {(kind === 'anime' && animeEpisodes.length > 0) && (
          <div className="watch-sidebar">
            <h3>Episodios</h3>
            <div className="episode-scroll">
              {animeEpisodes.map((ep, i) => {
                // Usar ?? en lugar de || para no tratar el episodio 0 (OVAs/especiales) como falsy
                const epNum = ep.number ?? i + 1
                const isActive = ep.url === animeEpisodeUrl
                if (!ep.url) return null
                const qs = new URLSearchParams({ kind: 'anime', animeUrl, url: ep.url, titulo: title })
                if (poster) qs.set('poster', poster)
                return (
                  <button
                    key={ep.url || i}
                    className={`episode focusable ${isActive ? 'active' : ''}`}
                    style={isActive ? { background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'var(--accent)' } : {}}
                    onClick={() => { if (!isActive) window.location.assign(`/ver?${qs.toString()}`) }}
                  >
                    <span style={{ fontWeight: isActive ? 700 : 500 }}>Episodio {epNum}</span>
                    {ep.title && <small style={isActive ? { color: 'var(--on-accent)', opacity: 0.8 } : {}}>{ep.title}</small>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Sidebar for Series */}
        {(kind === 'series' || kind === 'serie') && serieSeasons.length > 0 && (
          <div className="watch-sidebar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Episodios</h3>
              {serieSeasons.length > 1 && (
                <select 
                  value={selectedSeason} 
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--line)', cursor: 'pointer', outline: 'none' }}
                >
                  {serieSeasons.map(s => <option key={s.season} value={s.season}>T{s.season}</option>)}
                </select>
              )}
            </div>
            <div className="episode-scroll">
              {serieSeasons.find(s => s.season === selectedSeason)?.episodes.map((ep: any) => {
                // Usar ?? en lugar de || para no tratar ep 0 como falsy
                const epObj = typeof ep === 'number' ? { number: ep, title: undefined, url: undefined } : { number: Number((ep as any).number ?? 0), title: (ep as any).title, url: (ep as any).url }
                if (epObj.number < 0) return null
                const isActive = selectedSeason === season && epObj.number === episode
                const qs = new URLSearchParams({ kind: 'serie', slug, tipo: 'serie', temporada: String(selectedSeason), episodio: String(epObj.number), titulo: title })
                if (poster) qs.set('poster', poster)
                if (epObj.url) qs.set('url', epObj.url)
                return (
                  <button
                    key={epObj.number}
                    className={`episode focusable ${isActive ? 'active' : ''}`}
                    style={isActive ? { background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'var(--accent)' } : {}}
                    onClick={() => { if (!isActive) window.location.assign(`/ver?${qs.toString()}`) }}
                  >
                    <span style={{ fontWeight: isActive ? 700 : 500 }}>Episodio {epObj.number}</span>
                    {epObj.title && <small style={isActive ? { color: 'var(--on-accent)', opacity: 0.8 } : {}}>{epObj.title}</small>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>

      <Recommendations
        kind={kind as 'anime' | 'movie' | 'series'}
        title={title}
        slug={slug}
        animeUrl={animeUrl}
      />
    </div>
  )
}
