import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '../lib/api'
import { imageProxy } from '../lib/api'
import { canHaveSeasons, getSeasonsInfo, seasonCountLabel, type SeasonInfo } from '../lib/seasons'

const FALLBACK_COLORS = ['#d4af37', '#b8860b', '#7c5e10', '#5b2a86', '#b14aed']

function hashColor(title: string): string {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0
  return FALLBACK_COLORS[h % FALLBACK_COLORS.length]
}

function imgSrc(item: MediaItem): string | undefined {
  const raw = item.image || item.poster
  if (!raw) return undefined
  if (item.kind === 'anime') return imageProxy(raw)
  return raw
}

function navigateTo(item: MediaItem, season?: number): void {
  if (item.kind === 'anime') {
    if (item.episodeUrl) {
      const qs = new URLSearchParams({ 
        kind: 'anime', 
        animeUrl: item.url || item.slug || '', 
        url: item.episodeUrl 
      })
      if (item.image) qs.set('poster', item.image)
      if (item.title) qs.set('titulo', item.title)
      window.location.assign(`/ver?${qs.toString()}`)
      return
    }

    const url = item.url || item.slug
    if (url) {
      const qs = new URLSearchParams({ url })
      if (item.image) qs.set('poster', item.image)
      if (item.title) qs.set('titulo', item.title)
      window.location.assign(`/anime-detalle?${qs.toString()}`)
    }
    return
  }
  const slug = item.slug || item.url
  if (slug) {
    const qs = new URLSearchParams({ slug, tipo: item.kind })
    if (item.image || item.poster) qs.set('poster', item.image || item.poster || '')
    if (item.title) qs.set('titulo', item.title)
    if (season && season > 1) qs.set('temporada', String(season))
    window.location.assign(`/detalle?${qs.toString()}`)
  }
}

function navigateToRelation(relation: { title: string; url: string; image?: string }): void {
  const qs = new URLSearchParams({ url: relation.url })
  if (relation.image) qs.set('poster', relation.image)
  if (relation.title) qs.set('titulo', relation.title)
  window.location.assign(`/anime-detalle?${qs.toString()}`)
}

export default function MediaCard({ item }: { item: MediaItem }) {
  const ref = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const [info, setInfo] = useState<SeasonInfo | null>(null)
  const [loaded, setLoaded] = useState(false)
  const src = imgSrc(item)
  const hasSeasons = canHaveSeasons(item)

  useEffect(() => {
    if (!focused || loaded || !hasSeasons) return
    const timer = window.setTimeout(() => {
      getSeasonsInfo(item)
        .then((result) => {
          if (result && result.count > 1) setInfo(result)
        })
        .catch(() => undefined)
        .finally(() => setLoaded(true))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [focused, loaded, hasSeasons, item])

  const label = seasonCountLabel(info)

  const handleFocus = () => setFocused(true)
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
  }

  return (
    <div
      ref={ref}
      className="card focusable"
      data-nav
      tabIndex={0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={() => {
        navigateTo(item)
      }}
    >
      <div className="card-poster">
        {src ? (
          <img src={src} alt={item.title} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <div className="fallback" style={{ color: hashColor(item.title) }}>{item.title.charAt(0).toUpperCase()}</div>
        )}
        <span className={`badge ${item.kind === 'anime' ? 'anime' : ''}`}>
          {item.kind === 'anime' ? 'Anime' : item.kind === 'series' ? 'Serie' : 'Película'}
        </span>
        {label && focused && (
          <span className="badge seasons-badge">{label}</span>
        )}
        {focused && label && info && (
          <div className="season-quick" role="menu" aria-label={`Temporadas de ${item.title}`}>
            {info.seasons.length > 0 ? (
              info.seasons.map((s) => (
                <button
                  key={s.season}
                  className="season-quick-btn"
                  data-nav
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateTo(item, s.season)
                  }}
                >
                  T{s.season}
                </button>
              ))
            ) : (
              info.relations.map((rel) => (
                <button
                  key={rel.url}
                  className="season-quick-btn"
                  data-nav
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateToRelation(rel)
                  }}
                >
                  {rel.title.length > 22 ? `${rel.title.slice(0, 21)}…` : rel.title}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div className="card-info">
        <div className="card-title">{item.title}</div>
        {(item.year || item.episodeNumber) && (
          <div className="card-sub">
            {item.episodeNumber ? `Episodio ${item.episodeNumber}` : item.year}
          </div>
        )}
      </div>
    </div>
  )
}
