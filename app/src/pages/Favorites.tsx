import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSpatialNav } from '../hooks/useSpatialNav'
import { useFavorites } from '../hooks/useFavorites'
import MediaCard from '../components/MediaCard'

export default function Favorites() {
  const ref = useRef<HTMLDivElement>(null)
  useSpatialNav(ref)
  const { favorites, remove } = useFavorites()

  return (
    <div className="main" ref={ref}>
      <section className="section rise">
        <div className="section-head" style={{ marginBottom: 30 }}>
          <h1 className="section-title">Mis Favoritos</h1>
        </div>

        {favorites.length === 0 ? (
          <div className="empty-state">
            <p>No has guardado nada en tus favoritos todavía.</p>
            <div style={{ marginTop: 20 }}>
              <Link to="/peliculas" className="btn btn-outline" data-nav>Explorar Películas</Link>
              <Link to="/series" className="btn btn-outline" data-nav style={{ marginLeft: 10 }}>Explorar Series</Link>
              <Link to="/anime" className="btn btn-outline" data-nav style={{ marginLeft: 10 }}>Explorar Anime</Link>
            </div>
          </div>
        ) : (
          <div className="row mode1 row-cols-md-4 row-cols-2 row-cols-lg-6">
            {favorites.map((fav) => {
              const urlParams = new URLSearchParams(fav.url.split('?')[1] || '')
              const isAnime = fav.url.includes('anime')
              const kind = urlParams.get('kind') || (isAnime ? 'anime' : 'movie')
              
              const item = {
                title: fav.title,
                poster: fav.poster,
                image: fav.poster,
                url: fav.id, // For anime, id is the url
                slug: fav.id, // For movies/series, id is the slug
                kind,
                provider: isAnime ? 'jkanime' : 'pelisplus'
              }

              return (
                <div key={fav.id} style={{ position: 'relative' }}>
                  <MediaCard item={item} rank={0} />
                  <button
                    className="btn focusable"
                    onClick={() => remove(fav.id)}
                    aria-label="Quitar de favoritos"
                    title="Quitar de favoritos"
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                    data-nav
                  >
                    X
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
