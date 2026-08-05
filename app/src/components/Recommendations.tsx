import { useEffect, useState } from 'react'
import { animeApi, peliApi } from '../lib/api'
import type { MediaItem, MediaKind } from '../types'
import MediaCard from './MediaCard'

type Genre = { name: string; slug?: string }

interface RecommendationsProps {
  kind: MediaKind
  title: string
  slug?: string
  animeUrl?: string
  genreName?: string
  genreSlug?: string
  animeType?: string
  animeProvider?: string
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeGenres(value: unknown): Genre[] {
  if (!Array.isArray(value)) return []
  return value.reduce<Genre[]>((genres, entry) => {
    if (typeof entry === 'string' && entry.trim()) {
      genres.push({ name: entry, slug: slugify(entry) })
      return genres
    }
    if (entry && typeof entry === 'object') {
      const item = entry as Record<string, unknown>
      const name = String(item.name || item.title || '').trim()
      if (name) genres.push({ name, slug: typeof item.slug === 'string' ? item.slug : slugify(name) })
    }
    return genres
  }, [])
}

function nextCatalogPage(category: MediaKind): number {
  try {
    const key = `akashi:recommendations-page:${category}`
    const previous = Number(window.sessionStorage.getItem(key) || '0')
    const page = previous >= 1 && previous <= 4 ? (previous % 4) + 1 : 1
    window.sessionStorage.setItem(key, String(page))
    return page
  } catch {
    return 1 + Math.floor(Math.random() * 4)
  }
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = result[index]
    result[index] = result[randomIndex]
    result[randomIndex] = current
  }
  return result
}

/** Una sola fuente de recomendaciones para fichas y reproductor. */
export default function Recommendations({ kind, title, slug, animeUrl, genreName, genreSlug, animeType, animeProvider }: RecommendationsProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [genre, setGenre] = useState<Genre | undefined>(genreName ? { name: genreName, slug: genreSlug || slugify(genreName) } : undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const currentTitle = title.trim().toLocaleLowerCase()

    const load = async () => {
      setLoading(true)
      try {
        let selectedGenre: Genre | undefined = genreName ? { name: genreName, slug: genreSlug || slugify(genreName) } : undefined
        let detectedAnimeType = animeType
        let detectedProvider = animeProvider

        if (!selectedGenre) {
          const raw = kind === 'anime' && animeUrl
            ? await animeApi.info(animeUrl)
            : slug
              ? await peliApi.info(slug, kind === 'series' ? 'serie' : 'movie')
              : undefined
          const data = (raw && typeof raw === 'object'
            ? ((raw as Record<string, unknown>).data ?? raw)
            : {}) as Record<string, unknown>
          selectedGenre = normalizeGenres(data.genres)[0]
          detectedAnimeType = String(data.type || detectedAnimeType || '')
          detectedProvider = typeof data.provider === 'string' ? data.provider : detectedProvider
        }

        // Conservamos el género solo para el mundo del título actual y completamos
        // con los otros dos: así nunca se convierte en una lista de puras series.
        const pages: Record<MediaKind, number> = {
          anime: nextCatalogPage('anime'),
          movie: nextCatalogPage('movie'),
          series: nextCatalogPage('series'),
        }
        const [animeResult, moviesResult, seriesResult] = await Promise.allSettled([
          animeApi.catalog(
            pages.anime,
            kind === 'anime'
              ? selectedGenre?.slug || (detectedAnimeType?.toLowerCase().includes('donghua') ? 'donghua' : undefined)
              : undefined,
            kind === 'anime' ? detectedProvider : undefined,
          ),
          peliApi.catalog({ type: 'movie', page: pages.movie, genre: kind === 'movie' ? selectedGenre?.slug : undefined }),
          peliApi.catalog({ type: 'serie', page: pages.series, genre: kind === 'series' ? selectedGenre?.slug : undefined }),
        ])
        const resultItems = (result: PromiseSettledResult<MediaItem[]>): MediaItem[] =>
          result.status === 'fulfilled' ? result.value : []
        const eligible = (catalog: MediaItem[]) => catalog.filter(
          (item) => item.title.trim().toLocaleLowerCase() !== currentTitle,
        )
        const buckets: Record<MediaKind, MediaItem[]> = {
          anime: shuffle(eligible(resultItems(animeResult))),
          movie: shuffle(eligible(resultItems(moviesResult))),
          series: shuffle(eligible(resultItems(seriesResult))),
        }
        const order: MediaKind[] = [kind, ...(['anime', 'movie', 'series'] as MediaKind[]).filter((entry) => entry !== kind)]
        const unique = new Set<string>()
        const recommended: MediaItem[] = []

        // Turnos de uno por categoría: el resultado se siente deliberadamente variado.
        while (recommended.length < 12 && order.some((entry) => buckets[entry].length > 0)) {
          for (const entry of order) {
            const item = buckets[entry].shift()
            if (!item) continue
            const identity = (item.url || item.slug || item.title).toLocaleLowerCase()
            if (!identity || unique.has(identity)) continue
            unique.add(identity)
            recommended.push(item)
            if (recommended.length === 12) break
          }
        }

        if (active) {
          setGenre(selectedGenre)
          setItems(recommended)
        }
      } catch {
        // La ficha y el reproductor siguen funcionando si el catálogo falla.
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [kind, title, slug, animeUrl, genreName, genreSlug, animeType, animeProvider])

  if (items.length === 0 && !loading) return null

  return (
    <section className="section rise" aria-label="Recomendaciones">
      <div className="section-head">
        <h2 className="section-title">Recomendaciones</h2>
        {genre && <span className="chip" style={{ fontSize: '0.78rem' }}>Afinidad: {genre.name} · selección variada</span>}
      </div>
      {loading ? (
        <div className="spinner" role="status" aria-label="Cargando recomendaciones" />
      ) : (
        <div className="grid">
          {items.map((item, index) => (
            <div key={`${item.url || item.slug || item.title}-${index}`} className="rise rise-2">
              <MediaCard item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
