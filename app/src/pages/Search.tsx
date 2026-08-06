import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { animeApi, peliApi, type MediaItem } from '../lib/api'
import MediaCard from '../components/MediaCard'
import { useSpatialNav } from '../hooks/useSpatialNav'
import SearchFilters from '../components/SearchFilters'

export default function Search() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const ref = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [genres, setGenres] = useState<Array<{ name: string; slug: string }>>([])
  const [genre, setGenre] = useState('')
  const [contentType, setContentType] = useState<'all' | 'movie' | 'series' | 'anime'>('all')

  useSpatialNav(ref)

  useEffect(() => {
    void peliApi.genres().then(setGenres).catch(() => setGenres([]))
  }, [])

  useEffect(() => {
    const query = q.trim()
    if (!query) {
      setItems([])
      setError(null)
      setLoading(false)
      return
    }
    let mounted = true
    const timeout = window.setTimeout(() => {
      setLoading(true)
      setError(null)

      const seen = new Map<string, MediaItem>()
      
      const push = (item: MediaItem) => {
        const key = item.title.toLowerCase()
        if (!seen.has(key)) {
          seen.set(key, item)
        } else {
          // Si ya existe pero el nuevo es anime, sobreescribir (priorizamos animeApi sobre TMDB para animes)
          if (item.kind === 'anime' && seen.get(key)?.kind !== 'anime') {
            seen.set(key, item)
          }
        }
      }

      const requests: Promise<void>[] = []
      if (contentType !== 'anime') requests.push(peliApi.search(query).then((r) => r.forEach(push)))
      if (contentType !== 'movie' && contentType !== 'series') requests.push(animeApi.search(query).then((r) => r.forEach(push)))

      Promise.allSettled(requests).then((results) => {
        if (!mounted) return
        const merged = Array.from(seen.values())
        const typed = contentType === 'all' ? merged : merged.filter((item) => item.kind === contentType)
        if (genre) {
          const genreRequest = contentType === 'all'
            ? Promise.all([peliApi.catalog({ genre }), animeApi.catalog(1, genre)]).then(([moviesAndSeries, anime]) => [...moviesAndSeries, ...anime])
            : contentType === 'anime'
              ? animeApi.catalog(1, genre)
              : peliApi.catalog({ type: contentType, genre })
          void genreRequest.then((genreItems) => {
            if (!mounted) return
            const genreTitles = new Set(genreItems.map((item) => item.title.toLocaleLowerCase()))
            setItems(typed.filter((item) => genreTitles.has(item.title.toLocaleLowerCase())))
          })
        } else {
          setItems(typed)
        }
        setLoading(false)
        if (typed.length > 0) return

        const rateLimited = results.some(
          (result) => result.status === 'rejected' && String(result.reason).includes('HTTP 429'),
        )
        setError(
          rateLimited
            ? 'El servidor está recibiendo muchas búsquedas. Espera un minuto e inténtalo de nuevo.'
            : 'No se encontraron resultados.',
        )
      })
    }, 650)

    return () => {
      mounted = false
      window.clearTimeout(timeout)
    }
  }, [q, contentType, genre])

  return (
    <div ref={ref}>
      <section className="hero">
        <div>
          <span className="kicker">Resultados</span>
          <h1>
            Buscando <em>“{q}”</em>
          </h1>
        </div>
      </section>

      <SearchFilters
        searchValue={q}
        onSearchChange={() => {}}
        onSearchSubmit={() => {}}
        genre={genre}
        onGenreChange={setGenre}
        genres={genres.map(g => ({ value: g.slug, label: g.name }))}
        contentType={contentType}
        onContentTypeChange={setContentType}
        loading={loading}
        layout="horizontal"
      />

      {loading && <div className="spinner" role="status" aria-label="Cargando" />}

      {!loading && error && <div className="empty"><h3>{error}</h3></div>}

      {!loading && items.length > 0 && (
        <div className="grid">
          {items.map((item, i) => (
            <div key={`${item.kind}-${item.title}-${i}`} className="rise rise-2">
              <MediaCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
