import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { animeApi, peliApi, type MediaItem } from '../lib/api'
import MediaCard from '../components/MediaCard'
import ContinueWatching from '../components/ContinueWatching'
import { useSpatialNav } from '../hooks/useSpatialNav'

interface Section {
  key: string
  title: string
  kind: 'movie' | 'series' | 'anime'
  load: () => Promise<MediaItem[]>
}

const getRandomPage = () => Math.floor(Math.random() * 5) + 1

const SECTIONS: Section[] = [
  {
    key: 'movies',
    title: 'Top Últimas Películas',
    kind: 'movie',
    load: () => peliApi.catalog({ type: 'movie' }),
  },
  {
    key: 'series',
    title: 'Top Últimas Series',
    kind: 'series',
    load: () => peliApi.catalog({ type: 'serie' }),
  },
  {
    key: 'anime',
    title: 'Últimos Capítulos de Anime',
    kind: 'anime',
    load: () => animeApi.catalog(1),
  },
  {
    key: 'isekai',
    title: 'Animes Isekai',
    kind: 'anime',
    load: () => animeApi.catalog(1, 'isekai', 'animeav1'),
  },
  {
    key: 'rec-action',
    title: 'Recomendaciones de Acción',
    kind: 'movie',
    load: () => peliApi.catalog({ type: 'movie', genre: 'accion', page: getRandomPage() }),
  },
  {
    key: 'rec-drama',
    title: 'Recomendaciones de Drama',
    kind: 'movie',
    load: () => peliApi.catalog({ type: 'movie', genre: 'drama', page: getRandomPage() }),
  },
  {
    key: 'rec-horror',
    title: 'Recomendaciones de Terror',
    kind: 'movie',
    load: () => peliApi.catalog({ type: 'movie', genre: 'terror', page: getRandomPage() }),
  },
  {
    key: 'rec-thriller',
    title: 'Recomendaciones de Suspenso',
    kind: 'movie',
    load: () => peliApi.catalog({ type: 'movie', genre: 'suspenso', page: getRandomPage() }),
  },
]

export default function Home() {
  const ref = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<Record<string, MediaItem[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useSpatialNav(ref)

  useEffect(() => {
    let mounted = true
    const results: Record<string, MediaItem[]> = {}
    Promise.allSettled(
      SECTIONS.map(async (s) => {
        const items = await s.load()
        results[s.key] = items
      }),
    )
      .finally(() => {
        if (mounted) {
          setData(results)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setError('No se pudo conectar con los servidores. Verifica que las APIs estén corriendo.')
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div ref={ref}>
      <section className="hero rise">
        <div>
          <span className="kicker">Streaming abierto · Multi-fuente</span>
          <h1>
            Todo el <em>entretenimiento</em> en un solo lugar
          </h1>
          <p>
            Películas, series y anime de múltiples proveedores en alta calidad.
            Instalable en tu móvil y en tu Android TV.
          </p>
          <div className="hero-meta">
            <span className="chip">▶ HD</span>
            <span className="chip">◐ Subtítulos</span>
            <span className="chip">▣ Multi-fuente</span>
          </div>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <ContinueWatching />

      {loading &&
        !error &&
        SECTIONS.map((s) => (
          <section key={s.key} className="section">
            <div className="section-head">
              <h2 className="section-title">{s.title}</h2>
            </div>
            <div className="grid" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ aspectRatio: '2/3' }} />
              ))}
            </div>
          </section>
        ))}

      {!loading &&
        SECTIONS.map((s) => {
          const items = data[s.key] || []
          if (items.length === 0) return null
          return (
            <section key={s.key} className="section rise">
              <div className="section-head">
                <h2 className="section-title">{s.title}</h2>
                <Link to={s.kind === 'anime' ? '/anime' : `/${s.kind === 'movie' ? 'peliculas' : 'series'}`} className="nav-item">
                  Ver todo →
                </Link>
              </div>
              <div className="grid">
                {items.slice(0, s.key.match(/accion|drama|terror|suspenso/) ? 6 : 10).map((item, i) => (
                  <div key={`${s.key}-${item.title}-${i}`} className="rise rise-2">
                    <MediaCard item={item} />
                  </div>
                ))}
              </div>
            </section>
          )
        })}

      {!loading && Object.values(data).every((v) => v.length === 0) && !error && (
        <div className="empty">
          <h3>Sin contenido</h3>
          <p>Los catálogos no devolvieron resultados. Revisa las APIs.</p>
        </div>
      )}
    </div>
  )
}
