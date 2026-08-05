import { useEffect, useMemo, useRef, useState } from 'react'
import { animeApi, peliApi, type MediaItem } from '../lib/api'
import MediaCard from '../components/MediaCard'
import { useSpatialNav } from '../hooks/useSpatialNav'

interface CatalogProps {
  kind: 'peliculas' | 'series' | 'anime'
}

function matchesAnimeCategory(item: MediaItem, category: 'anime' | 'donghua' | 'ova'): boolean {
  const type = (item.type || '').toLocaleLowerCase()
  if (category === 'donghua') return type.includes('donghua')
  if (category === 'ova') return type.includes('ova')
  // La API puede omitir el tipo en algunos proveedores; excluimos solamente
  // los tipos que inequívocamente no son anime para no dejar el catálogo vacío.
  return !/(serie|series|pelicula|película|movie|film)/.test(type)
}

export default function Catalog({ kind }: CatalogProps) {
  const isAnime = kind === 'anime'
  const title = isAnime ? 'Anime' : kind === 'peliculas' ? 'Películas' : 'Series'
  const typeParam = isAnime ? undefined : kind === 'peliculas' ? 'movie' : 'series'

  const ref = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<MediaItem[]>([])
  const [premieres, setPremieres] = useState<MediaItem[]>([])
  const [topTen, setTopTen] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [animeType, setAnimeType] = useState<'anime' | 'donghua' | 'ova'>('anime')
  const provider = animeType === 'donghua' ? 'jkanime' : undefined

  useSpatialNav(ref)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    const load = isAnime 
      ? animeApi.catalog(page, animeType, provider || (animeType === 'anime' ? 'animeflv' : 'jkanime')) 
      : peliApi.catalog({ type: typeParam, page })
    load
      .then((r) => {
        const filtered = isAnime ? r.filter((item) => matchesAnimeCategory(item, animeType)) : r
        if (mounted) setItems((prev) => (page === 1 ? filtered : [...prev, ...filtered]))
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [page, isAnime, typeParam, animeType, provider])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const firstPage = isAnime 
        ? animeApi.catalog(1, animeType, provider || (animeType === 'anime' ? 'animeflv' : 'jkanime')) 
        : peliApi.catalog({ type: typeParam, page: 1 })
      const secondPage = isAnime 
        ? animeApi.catalog(2, animeType, provider || (animeType === 'anime' ? 'animeflv' : 'jkanime')) 
        : peliApi.catalog({ type: typeParam, page: 2 })
      const [recent, more] = await Promise.all([firstPage, secondPage])
      if (!mounted) return
      const filteredRecent = isAnime ? recent.filter((item) => matchesAnimeCategory(item, animeType)) : recent
      const filteredMore = isAnime ? more.filter((item) => matchesAnimeCategory(item, animeType)) : more
      const pool = [...filteredRecent, ...filteredMore]
      setPremieres(filteredRecent.slice(0, 10))
      setTopTen(
        [...pool]
          .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
          .slice(0, 10),
      )
    }
    void load().catch(() => undefined)
    return () => { mounted = false }
  }, [isAnime, typeParam, animeType, provider])

  // Resetear página y items al cambiar tipo
  useEffect(() => {
    setPage(1)
    setItems([])
  }, [animeType])

  const hasShowcase = useMemo(() => topTen.length > 0 || premieres.length > 0, [topTen, premieres])

  return (
    <div ref={ref}>
      <section className="hero" style={{ paddingBottom: isAnime ? '2rem' : undefined }}>
        <div>
          <span className="kicker">Catálogo</span>
          <h1>
            <em>{title}</em>
          </h1>
          {isAnime && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
              <button 
                className={`chip ${animeType === 'anime' ? 'active' : ''}`}
                onClick={() => setAnimeType('anime')}
                style={{ background: animeType === 'anime' ? 'var(--c-accent)' : undefined, color: animeType === 'anime' ? '#fff' : undefined, cursor: 'pointer', border: 'none' }}
              >
                Animes
              </button>
              <button 
                className={`chip ${animeType === 'donghua' ? 'active' : ''}`}
                onClick={() => setAnimeType('donghua')}
                style={{ background: animeType === 'donghua' ? 'var(--c-accent)' : undefined, color: animeType === 'donghua' ? '#fff' : undefined, cursor: 'pointer', border: 'none' }}
              >
                Donghuas
              </button>
              <button 
                className={`chip ${animeType === 'ova' ? 'active' : ''}`}
                onClick={() => setAnimeType('ova')}
                style={{ background: animeType === 'ova' ? 'var(--c-accent)' : undefined, color: animeType === 'ova' ? '#fff' : undefined, cursor: 'pointer', border: 'none' }}
              >
                OVAs
              </button>
            </div>
          )}
        </div>
      </section>

      {loading && page === 1 && <div className="spinner" role="status" aria-label="Cargando" />}

      {hasShowcase && (
        <>
          {topTen.length > 0 && (
            <section className="section rise showcase-section">
              <div className="section-head">
                <div>
                  <span className="kicker">Lo más visto</span>
                  <h2 className="section-title">Top 10 de {title.toLowerCase()}</h2>
                </div>
              </div>
              <div className="grid">
                {topTen.map((item, index) => (
                  <div className="ranked-card rise rise-2" key={`top-${item.title}-${index}`}>
                    <span className="rank-number" aria-label={`Puesto ${index + 1}`}>{String(index + 1).padStart(2, '0')}</span>
                    <MediaCard item={item} />
                  </div>
                ))}
              </div>
            </section>
          )}
          {premieres.length > 0 && (
            <section className="section rise showcase-section">
              <div className="section-head">
                <div>
                  <span className="kicker">Recién agregados</span>
                  <h2 className="section-title">Estrenos de {title.toLowerCase()}</h2>
                </div>
              </div>
              <div className="grid">
                {premieres.map((item, index) => <div className="rise rise-2" key={`premiere-${item.title}-${index}`}><MediaCard item={item} /></div>)}
              </div>
            </section>
          )}
        </>
      )}

      {items.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="section-title">Explorar catálogo</h2></div>
          <div className="grid">
            {items.map((item, i) => (
              <div key={`${item.kind}-${item.title}-${i}`} className="rise rise-2">
                <MediaCard item={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && (
        <div style={{ display: 'grid', placeItems: 'center', marginTop: 32 }}>
          <button
            className="btn btn-ghost"
            data-nav
            onClick={() => setPage((p) => p + 1)}
          >
            Cargar más ↓
          </button>
        </div>
      )}
    </div>
  )
}
