import { useEffect, useRef } from 'react'
import { useSpatialNav } from '../hooks/useSpatialNav'

export default function Apps() {
  const ref = useRef<HTMLDivElement>(null)
  
  useSpatialNav(ref)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div ref={ref} className="main" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
      <div className="hero rise" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 24, padding: '40px 20px', marginTop: 40 }}>
        <span className="kicker">Aplicaciones Nativas</span>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: '2.5rem', marginTop: 12, marginBottom: 16 }}>
          Lleva AkashiVerse a todas partes
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto 40px' }}>
          Descarga nuestra aplicación oficial para disfrutar de la mejor experiencia sin interrupciones, ventanas emergentes ni publicidad molesta. 
          Totalmente optimizada para tu móvil y tu Android TV.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, padding: '0 20px' }}>
          
          {/* Mobile APK */}
          <div className="card focusable rise-2" data-nav tabIndex={0} style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: 16, borderRadius: '50%', marginBottom: 16 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>AkashiVerse Mobile</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 24 }}>Para teléfonos y tablets Android. Optimizado para controles táctiles.</p>
            <a 
              href="/downloads/akashiverse-mobile.apk" 
              className="btn btn-primary" 
              style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}
            >
              Descargar APK Móvil
            </a>
          </div>

          {/* TV APK */}
          <div className="card focusable rise-2" data-nav tabIndex={0} style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--line)', animationDelay: '100ms' }}>
            <div style={{ background: 'var(--accent)', color: 'white', padding: 16, borderRadius: '50%', marginBottom: 16 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                <polyline points="17 2 12 7 7 2"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>AkashiVerse TV</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 24 }}>Para Android TV, Fire TV y Chromecast. Soporta control remoto.</p>
            <a 
              href="/downloads/akashiverse-tv.apk" 
              className="btn btn-outline" 
              style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}
            >
              Descargar APK para TV
            </a>
          </div>

        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)', fontSize: '0.85rem', color: 'var(--muted)' }}>
          <strong>Nota de instalación:</strong> Al instalar el APK por primera vez, tu dispositivo te pedirá permisos para "Instalar aplicaciones de origen desconocido". Esto es normal ya que la aplicación se descarga directamente de nuestra web.
        </div>
      </div>
    </div>
  )
}
