import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { animeApi, peliApi, type MediaItem } from '../lib/api'
import MediaCard from '../components/MediaCard'
import { useSpatialNav } from '../hooks/useSpatialNav'

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

      const seen = new Set<string>()
      const merged: MediaItem[] = []
      const push = (item: MediaItem) => {
        const key = `${item.kind}:${item.title.toLowerCase()}`
        if (!seen.has(key)) {
          seen.add(key)
          merged.push(item)
        }
      }

      const requests: Promise<void>[] = []
      if (contentType !== 'anime') requests.push(peliApi.search(query).then((r) => r.forEach(push)))
      if (contentType !== 'movie' && contentType !== 'series') requests.push(animeApi.search(query).then((r) => r.forEach(push)))

      Promise.allSettled(requests).then((results) => {
        if (!mounted) return
        const typed = contentType === 'all' ? merged : merged.filter((item) => item.kind === contentType)
        // El catálogo de los proveedores sí permite filtrar género. Las búsquedas por
        // texto no incluyen metadatos de género, por lo que se consulta ese catálogo
        // y se conserva únicamente la intersección por título.
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

      <section className="search-filters" aria-label="Filtros de búsqueda">
        <div>
          <span className="kicker">Filtrar resultados</span>
          <p>Género está disponible en los catálogos actuales. Año y actor no los exponen los proveedores conectados.</p>
        </div>
        <label>
          <span>Tipo</span>
          <select value={contentType} onChange={(e) => setContentType(e.target.value as typeof contentType)} data-nav>
            <option value="all">Todo</option><option value="movie">Películas</option><option value="series">Series</option><option value="anime">Anime</option>
          </select>
        </label>
        <label>
          <span>Género</span>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} data-nav>
            <option value="">Todos los géneros</option>
            {genres.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label>
          <span>Año</span>
          <input value="No disponible" disabled aria-label="Filtro por año no disponible en los proveedores" />
        </label>
        <label>
          <span>Actor</span>
          <input value="No disponible" disabled aria-label="Filtro por actor no disponible en los proveedores" />
        </label>
      </section>

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
