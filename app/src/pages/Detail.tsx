import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { peliApi } from '../lib/api'
import { useSpatialNav } from '../hooks/useSpatialNav'
import { normalizeSeasons } from '../lib/seasons'
import type { ContentInfo } from '../types'
import Recommendations from '../components/Recommendations'
import { useFavorites } from '../hooks/useFavorites'

interface EpisodeItem {
  episode: number
  title?: string
}

function buildEpisodeQuery(
  slug: string,
  kind: string,
  seasonNum: number,
  epNum: number,
  title: string,
  hasNext: boolean,
  poster?: string,
): string {
  const base = `/ver?kind=${kind}&slug=${encodeURIComponent(slug)}&tipo=${kind === 'movie' ? 'movie' : 'serie'}&temporada=${seasonNum}&episodio=${epNum}&titulo=${encodeURIComponent(title)}`
  const next = hasNext
    ? `&nextUrl=${encodeURIComponent(`?kind=${kind}&slug=${encodeURIComponent(slug)}&tipo=serie&temporada=${seasonNum}&episodio=${epNum + 1}&titulo=${encodeURIComponent(title)}`)}`
    : ''
  const posterQ = poster ? `&poster=${encodeURIComponent(poster)}` : ''
  return base + next + posterQ
}

export default function Detail() {
  const [params] = useSearchParams()
  const slug = params.get('slug') || ''
  const tipo = params.get('tipo') || 'movie'
  const isSerie = tipo === 'serie' || tipo === 'series'
  const urlPoster = params.get('poster') || undefined
  const urlTitle = params.get('titulo') || ''
  const requestedSeason = Number(params.get('temporada'))

  const ref = useRef<HTMLDivElement>(null)
  const [info, setInfo] = useState<ContentInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSeason, setActiveSeason] = useState(1)

  const { toggle: toggleFav, checkIsFavorite } = useFavorites()
  const isFav = checkIsFavorite(slug)

  useSpatialNav(ref)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    peliApi
      .info(slug, isSerie ? 'serie' : 'movie')
      .then((raw) => {
        if (!mounted) return
        const data = raw as Record<string, unknown>
        const seasons = normalizeSeasons(data.seasons)
        setInfo({
          title: String(data.title || urlTitle || ''),
          poster: (data.poster as string) || urlPoster,
          synopsis: (data.synopsis as string) || (data.overview as string) || undefined,
          rating: data.rating != null ? String(data.rating) : undefined,
          year: data.year != null ? String(data.year) : undefined,
          genres: Array.isArray(data.genres) ? data.genres.map((g) => (typeof g === 'string' ? g : String((g as Record<string, unknown>).name || ''))) : [],
          directors: Array.isArray(data.directors) ? (data.directors as string[]) : [],
          actors: Array.isArray(data.actors) ? (data.actors as string[]) : [],
          seasons,
          provider: (data.provider as string) || undefined,
        })
        if (seasons.length > 0) setActiveSeason(requestedSeason && seasons.some((s) => s.season === requestedSeason) ? requestedSeason : seasons[0].season)
      })
      .catch((e) => {
        if (mounted) setError(`No se pudo cargar la información: ${e.message}`)
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [slug, isSerie, urlPoster, urlTitle, requestedSeason])

  const activeEpisodes = useMemo<EpisodeItem[]>(() => {
    const season = info?.seasons?.find((s) => s.season === activeSeason)
    if (!season) return []
    return season.episodes
      .map((ep) => {
        const raw = ep as unknown as Record<string, unknown>
        return {
          episode: typeof ep === 'number' ? ep : Number(raw.number || 0),
          title: (raw.title as string) || undefined,
        }
      })
      .filter((e) => e.episode > 0)
  }, [info, activeSeason])

  if (loading) {
    return (
      <div className="main">
        <section className="detail-hero rise">
          <div className="detail-poster">
            {urlPoster ? (
              <img src={urlPoster} alt={urlTitle || 'Cargando...'} loading="lazy" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: '3rem', color: 'var(--accent)' }}>
                {urlTitle ? urlTitle.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          <div className="detail-body">
            <span className="kicker">{isSerie ? 'Serie' : 'Película'}</span>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)' }}>{urlTitle || 'Cargando...'}</h1>
            <div className="spinner" role="status" aria-label="Cargando" style={{ marginTop: 20 }} />
          </div>
        </section>
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="main">
        <div className="error-box">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const playUrl = isSerie
    ? buildEpisodeQuery(slug, 'serie', activeSeason, activeEpisodes[0]?.episode || 1, info.title, activeEpisodes.length > 1, info.poster)
    : `/ver?kind=movie&slug=${encodeURIComponent(slug)}&tipo=movie&titulo=${encodeURIComponent(info.title)}&poster=${info.poster ? encodeURIComponent(info.poster) : ''}`

  return (
    <div ref={ref}>
      <section className="detail-hero rise">
        <div className="detail-poster">
          {info.poster ? (
            <img src={info.poster} alt={info.title} loading="lazy" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: '3rem', color: 'var(--accent)' }}>
              {info.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="detail-body">
          <span className="kicker">{isSerie ? 'Serie' : 'Película'}</span>
          <h1>{info.title}</h1>
          <div className="detail-meta">
            {info.year && <span className="chip">{info.year}</span>}
            {info.rating && <span className="chip">★ {info.rating}</span>}
            {info.genres?.slice(0, 4).map((g) => g && <span key={g} className="chip">{g}</span>)}
          </div>
          {info.synopsis && <p className="detail-synopsis">{info.synopsis}</p>}
          <div className="cta-row" style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" data-nav onClick={() => window.location.assign(playUrl)}>
              ▶ {isSerie ? 'Reproducir' : 'Reproducir'}
            </button>
            <button
              className={`btn ${isFav ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => toggleFav({
                id: slug,
                url: `/detalle?kind=${tipo}&slug=${slug}&tipo=${tipo}&titulo=${encodeURIComponent(info.title)}&poster=${encodeURIComponent(info.poster || '')}`,
                title: info.title,
                poster: info.poster,
                duration: 0,
                progress: 0,
                timestamp: Date.now()
              })}
              data-nav
              style={{
                background: isFav ? 'var(--accent)' : 'transparent',
                borderColor: 'var(--accent)',
                color: isFav ? 'black' : 'var(--accent)'
              }}
            >
              {isFav ? '❤️ Guardado' : '🤍 Guardar'}
            </button>
          </div>
        </div>
      </section>

      {isSerie && info.seasons && info.seasons.length > 0 && (
        <section className="section rise">
          <div className="section-head">
            <h2 className="section-title">Temporadas y episodios</h2>
          </div>
          <label className="season-picker">
            <span className="season-picker-label">Temporada</span>
            <select
              value={activeSeason}
              data-nav
              aria-label="Elegir temporada"
              onChange={(event) => setActiveSeason(Number(event.target.value))}
            >
              {info.seasons.map((s) => (
                <option key={s.season} value={s.season}>
                  Temporada {s.season}
                </option>
              ))}
            </select>
          </label>
          <div className="episode-list">
            {activeEpisodes.map((ep) => (
              <button
                key={ep.episode}
                className="episode focusable"
                data-nav
                onClick={() =>
                  window.location.assign(
                    buildEpisodeQuery(
                      slug,
                      'serie',
                      activeSeason,
                      ep.episode,
                      info.title,
                      activeEpisodes.some((e) => e.episode === ep.episode + 1),
                      info.poster,
                    ),
                  )
                }
              >
                <span>Episodio {ep.episode}</span>
                {ep.title && <small>{ep.title}</small>}
              </button>
            ))}
          </div>
        </section>
      )}

      <Recommendations
        kind={isSerie ? 'series' : 'movie'}
        title={info.title}
        slug={slug}
        genreName={info.genres?.[0]}
      />
    </div>
  )
}
