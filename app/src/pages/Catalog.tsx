import { useEffect, useMemo, useRef, useState } from 'react'
import { animeApi, peliApi, type MediaItem } from '../lib/api'
import MediaCard from '../components/MediaCard'
import { useSpatialNav } from '../hooks/useSpatialNav'

interface CatalogProps {
  kind: 'peliculas' | 'series' | 'anime'
}

function matchesAnimeCategory(item: MediaItem, category: 'anime' | 'donghua' | 'ova', isSearch: boolean): boolean {
  if (!isSearch) return true // El backend ya filtró por categoría en el catálogo.

  const type = (item.type || '').toLocaleLowerCase()
  if (category === 'donghua') return type.includes('donghua') || type.includes('chinese') // Es difícil filtrar por donghua en búsqueda sin metadata.
  if (category === 'ova') return type.includes('ova') || type.includes('special')
  if (category === 'anime') return !type.includes('donghua')
  return true
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

  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [genres, setGenres] = useState<{name: string; slug: string}[]>([])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchInput)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchInput])

  useEffect(() => {
    if (!isAnime) {
      peliApi.genres().then(setGenres).catch(console.error)
    } else {
      setGenres([
        { name: 'Acción', slug: 'accion' },
        { name: 'Aventura', slug: 'aventura' },
        { name: 'Comedia', slug: 'comedia' },
        { name: 'Drama', slug: 'drama' },
        { name: 'Fantasía', slug: 'fantasia' },
        { name: 'Magia', slug: 'magia' },
        { name: 'Mecha', slug: 'mecha' },
        { name: 'Romance', slug: 'romance' },
        { name: 'Sci-Fi', slug: 'sci-fi' },
        { name: 'Shounen', slug: 'shounen' },
        { name: 'Isekai', slug: 'isekai' },
        { name: 'Seinen', slug: 'seinen' },
      ])
    }
  }, [isAnime])

  useSpatialNav(ref)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    
    const fetchContent = async () => {
      let results: MediaItem[] = []
      if (debouncedQuery.trim()) {
         const q = debouncedQuery.trim()
         results = isAnime ? await animeApi.search(q).catch(()=>[]) : await peliApi.search(q).catch(()=>[])
         if (!isAnime && typeParam) {
           results = results.filter(i => i.kind === typeParam || i.type === typeParam)
         }
      } else {
         if (isAnime) {
           const genreParam = selectedGenre || (animeType === 'anime' ? undefined : animeType)
           results = await animeApi.catalog(page, genreParam, provider || 'jkanime').catch(()=>[])
         } else {
           results = await peliApi.catalog({ type: typeParam, page, genre: selectedGenre || undefined }).catch(()=>[])
         }
      }
      
      if (selectedYear) {
         results = results.filter(i => i.year === selectedYear || (i.title && i.title.includes(selectedYear)))
      }
      return results
    }

    fetchContent()
      .then((r) => {
        const filtered = isAnime ? r.filter((item) => matchesAnimeCategory(item, animeType, !!debouncedQuery.trim())) : r
        if (mounted) setItems((prev) => {
          if (page === 1) return filtered
          const newItems = filtered.filter(f => !prev.some(p => (p.url === f.url || p.title === f.title)))
          return [...prev, ...newItems]
        })
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [page, isAnime, typeParam, animeType, provider, debouncedQuery, selectedGenre, selectedYear])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const genreParam = animeType === 'anime' ? undefined : animeType;
      const firstPage = isAnime 
        ? animeApi.catalog(1, genreParam, provider || 'jkanime') 
        : peliApi.catalog({ type: typeParam, page: 1 })
      const secondPage = isAnime 
        ? animeApi.catalog(2, genreParam, provider || 'jkanime') 
        : peliApi.catalog({ type: typeParam, page: 2 })
      const [recent, more] = await Promise.all([firstPage, secondPage])
      if (!mounted) return
      const filteredRecent = isAnime ? recent.filter((item) => matchesAnimeCategory(item, animeType, false)) : recent
      const filteredMore = isAnime ? more.filter((item) => matchesAnimeCategory(item, animeType, false)) : more
      const poolMap = new Map()
      for (const item of [...filteredRecent, ...filteredMore]) {
        if (item.url && !poolMap.has(item.url)) poolMap.set(item.url, item)
      }
      const pool = Array.from(poolMap.values())
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

  // Resetear página y items al cambiar filtros
  useEffect(() => {
    setPage(1)
    setItems([])
  }, [animeType, debouncedQuery, selectedGenre, selectedYear])

  const hasShowcase = useMemo(() => (topTen.length > 0 || premieres.length > 0) && !debouncedQuery.trim(), [topTen, premieres, debouncedQuery])



  return (
    <div ref={ref}>
      <section className="hero" style={{ paddingBottom: isAnime ? '2rem' : undefined }}>
        <div>
          <span className="kicker">Catálogo</span>
          <h1>
            <em>{title}</em>
          </h1>
          <div className="catalog-filters">
             <div className="catalog-search-box">
               <span aria-hidden>⌕</span>
               <input
                 type="search"
                 placeholder={`Buscar en ${title}...`}
                 value={searchInput}
                 onChange={(e) => setSearchInput(e.target.value)}
                 className="focusable"
                 data-nav
               />
             </div>
             
             <select 
               value={selectedGenre} 
               onChange={(e) => setSelectedGenre(e.target.value)}
               className="catalog-select focusable"
               data-nav
             >
               <option value="">Cualquier género</option>
               {genres.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
             </select>
             
             <select 
               value={selectedYear} 
               onChange={(e) => setSelectedYear(e.target.value)}
               className="catalog-select focusable"
               data-nav
             >
               <option value="">Cualquier año</option>
               {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                 <option key={year} value={String(year)}>{year}</option>
               ))}
             </select>
          </div>

          {isAnime && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button 
                className={`btn ${animeType === 'anime' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setAnimeType('anime')}
                data-nav
              >
                Animes
              </button>
              <button 
                className={`btn ${animeType === 'donghua' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setAnimeType('donghua')}
                data-nav
              >
                Donghuas
              </button>
              <button 
                className={`btn ${animeType === 'ova' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setAnimeType('ova')}
                data-nav
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
          <div className="section-head">
            <h2 className="section-title">
              {debouncedQuery.trim() ? `Resultados de búsqueda` : `Explorar catálogo`}
            </h2>
          </div>
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
