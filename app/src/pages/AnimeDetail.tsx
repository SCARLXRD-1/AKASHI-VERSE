import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { animeApi, imageProxy } from '../lib/api'
import { useSpatialNav } from '../hooks/useSpatialNav'
import type { RelatedEntry } from '../lib/seasons'
import Recommendations from '../components/Recommendations'

interface AnimeEpisode {
  number: number
  title?: string
  url: string
}

interface AnimeGenre {
  name: string
  slug?: string
}

interface AnimeInfo {
  title: string
  image?: string
  backdrop?: string
  description?: string
  year?: string
  score?: number
  genres?: AnimeGenre[]
  type?: string
  status?: string
  totalEpisodes?: number
  episodes: AnimeEpisode[]
  relations?: RelatedEntry[]
  seasons?: RelatedEntry[]
}

function buildWatchUrl(animeUrl: string, episodeUrl: string, title: string, poster: string | undefined, nextUrl: string | undefined, lang?: string): string {
  const qs = new URLSearchParams({
    kind: 'anime',
    animeUrl,
    url: episodeUrl,
    titulo: title,
  })
  if (poster) qs.set('poster', poster)
  if (nextUrl) qs.set('nextUrl', nextUrl)
  if (lang) qs.set('lang', lang)
  return `/ver?${qs.toString()}`
}

function normalizeGenres(value: unknown): AnimeGenre[] {
  if (!Array.isArray(value)) return []
  return value.reduce<AnimeGenre[]>((acc, g) => {
    if (typeof g === 'string') {
      if (g) acc.push({ name: g, slug: undefined })
      return acc
    }
    const obj = g as Record<string, unknown>
    const name = String(obj.name || obj.title || '')
    if (!name) return acc
    acc.push({ name, slug: typeof obj.slug === 'string' ? obj.slug : undefined })
    return acc
  }, [])
}

function relationQuery(rel: { url: string; image?: string; title: string }): string {
  const qs = new URLSearchParams({ url: rel.url })
  if (rel.image) qs.set('poster', rel.image)
  if (rel.title) qs.set('titulo', rel.title)
  return `/anime-detalle?${qs.toString()}`
}

export default function AnimeDetail() {
  const [params] = useSearchParams()
  const url = params.get('url') || ''
  const urlPoster = params.get('poster') || undefined
  const urlTitle = params.get('titulo') || ''
  const ref = useRef<HTMLDivElement>(null)
  const [info, setInfo] = useState<AnimeInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useSpatialNav(ref)

  const fetchInfo = useCallback(() => {
    if (!url) {
      setError('Falta la URL del anime.')
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    animeApi
      .info(url)
      .then((payload) => {
        if (!mounted) return
        const data = (payload?.data ?? payload ?? {}) as Record<string, unknown>
        setInfo({
          title: String(data.title || urlTitle || ''),
          image: (data.image as string) || urlPoster,
          backdrop: (data.backdrop as string) || undefined,
          description: (data.description as string) || (data.synopsis as string) || undefined,
          year: data.year != null ? String(data.year) : undefined,
          score: data.score != null ? Number(data.score) : undefined,
          genres: normalizeGenres(data.genres),
          type: (data.type as string) || undefined,
          status: (data.status as string) || undefined,
          totalEpisodes: data.totalEpisodes != null ? Number(data.totalEpisodes) : undefined,
          episodes: Array.isArray(data.episodes)
            ? (data.episodes as AnimeEpisode[])
            : [],
          relations: Array.isArray(data.relations)
            ? (data.relations as RelatedEntry[])
            : [],
          seasons: Array.isArray(data.seasons)
            ? (data.seasons as RelatedEntry[])
            : undefined,
        })
      })
      .catch((e) => mounted && setError(`No se pudo cargar el anime: ${e.message}`))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [url, urlPoster, urlTitle])

  useEffect(() => {
    fetchInfo()
  }, [fetchInfo])

  const relatedList = info?.seasons || info?.relations || []
  const currentPart = info ? { url, title: info.title } : null
  const allParts = currentPart ? [currentPart, ...relatedList.map(s => ({
    title: s.title,
    url: s.url || `https://jkanime.net/${(s as any).slug}/`
  }))] : []

  const uniqueParts = allParts.filter((p, index, self) => 
    index === self.findIndex((t) => (
      t.url === p.url
    ))
  )
  
  const hasParts = uniqueParts.length > 1

  if (loading) {
    const posterSrc = urlPoster ? imageProxy(urlPoster) : undefined
    return (
      <div className="main">
        <section className="detail-hero rise">
          <div className="detail-poster">
            {posterSrc ? (
              <img src={posterSrc} alt={urlTitle || 'Cargando...'} loading="lazy" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: '3rem', color: 'var(--accent)' }}>
                {urlTitle ? urlTitle.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          <div className="detail-body">
            <span className="kicker">Anime</span>
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

  const posterSrc = info.image ? imageProxy(info.image) : undefined

  const goEpisode = (index: number) => {
    const ep = info.episodes[index]
    const next = info.episodes[index + 1]
    const nextUrl = next ? `?${new URLSearchParams({ kind: 'anime', animeUrl: url, url: next.url, titulo: info.title, lang: 'SUB' }).toString()}` : undefined
    window.location.assign(buildWatchUrl(url, ep.url, info.title, info.image, nextUrl, 'SUB'))
  }

  return (
    <div ref={ref}>
      <section className="detail-hero rise">
        <div className="detail-poster">
          {posterSrc ? (
            <img src={posterSrc} alt={info.title} loading="lazy" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontSize: '3rem', color: 'var(--accent)' }}>
              {info.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="detail-body">
          <span className="kicker">Anime{info.type ? ` · ${info.type}` : ''}</span>
          <h1>{info.title}</h1>
          <div className="detail-meta">
            {info.year && <span className="chip">{info.year}</span>}
            {info.score != null && <span className="chip">★ {info.score}</span>}
            {info.status && <span className="chip">{info.status}</span>}
            {info.totalEpisodes != null && <span className="chip">{info.totalEpisodes} capítulos</span>}
            {info.genres?.slice(0, 4).map((g) => g && <span key={g.name} className="chip">{g.name}</span>)}
          </div>
          {info.description && <p className="detail-synopsis">{info.description}</p>}
          <div className="cta-row">
            <button className="btn btn-primary" data-nav onClick={() => info.episodes[0] && goEpisode(0)}>
              ▶ Reproducir primer capítulo
            </button>
          </div>
        </div>
      </section>

      {hasParts && (
        <section className="section rise">
          <div className="section-head">
            <h2 className="section-title">Temporadas y partes relacionadas</h2>
          </div>
          <label className="season-picker anime-parts">
            <span className="season-picker-label">Temporada o parte</span>
            <select
              value={url}
              data-nav
              aria-label="Cambiar de temporada o parte"
              onChange={(event) => {
                const selected = allParts.find((p) => p.url === event.target.value)
                if (selected && selected.url !== url) {
                  window.location.assign(relationQuery(selected))
                }
              }}
            >
              {uniqueParts.map((part, i) => (
                <option key={part.url} value={part.url}>
                  {i === 0 ? `Actual · ${part.title}` : part.title}
                </option>
              ))}
            </select>
          </label>
          <div className="grid">
            {relatedList.map((rel) => {
              const relUrl = rel.url || `https://jkanime.net/${(rel as any).slug}/`
              // JKAnime related animes don't always come with an image, so we fallback to a placeholder or skip image
              const relImg = rel.image ? imageProxy(rel.image) : undefined
              return (
                <div
                  key={relUrl}
                  className="card focusable"
                  data-nav
                  tabIndex={0}
                  onClick={() => window.location.assign(relationQuery({ url: relUrl, title: rel.title || '' }))}
                >
                  <div className="card-poster">
                    {relImg ? (
                      <img src={relImg} alt={rel.title} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <div className="fallback" style={{ color: 'var(--accent)' }}>{rel.title.charAt(0).toUpperCase()}</div>
                    )}
                    <span className="badge anime">Parte relacionada</span>
                  </div>
                  <div className="card-info">
                    <div className="card-title">{rel.title}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="section rise">
        <div className="section-head">
          <h2 className="section-title">Episodios</h2>
        </div>
        <div className="episode-list">
          {info.episodes.map((ep, i) => (
            <button
              key={`${ep.number}-${i}`}
              className="episode focusable"
              data-nav
              onClick={() => goEpisode(i)}
            >
              <span>Episodio {ep.number}</span>
              {ep.title && <small>{ep.title}</small>}
            </button>
          ))}
        </div>
        {info.episodes.length === 0 && (
          <div className="empty">
            <h3>Sin episodios</h3>
            <p>No se pudieron obtener los capítulos de este anime.</p>
          </div>
        )}
      </section>

      <Recommendations
        kind="anime"
        title={info.title}
        animeUrl={url}
        genreName={info.genres?.[0]?.name}
        genreSlug={info.genres?.[0]?.slug}
        animeType={info.type}
      />
    </div>
  )
}
