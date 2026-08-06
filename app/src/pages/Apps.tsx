import { useEffect, useRef } from 'react'
import { useSpatialNav } from '../hooks/useSpatialNav'

export default function Apps() {
  const ref = useRef<HTMLDivElement>(null)
  
  useSpatialNav(ref)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div ref={ref} className="main" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'radial-gradient(circle at top, rgba(var(--accent-rgb), 0.15), transparent 60%)' }}>
      
      <div className="rise" style={{ textAlign: 'center', maxWidth: 900, marginBottom: 60, marginTop: 40 }}>
        <span className="kicker" style={{ background: 'rgba(var(--accent-rgb), 0.2)', color: 'var(--accent)', padding: '6px 16px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
          Aplicaciones Nativas
        </span>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, margin: '24px 0 16px', textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          Lleva AkashiVerse <br/>a todas partes
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.2rem', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
          Disfruta de la mejor experiencia sin interrupciones ni publicidad molesta. 
          Nuestras aplicaciones están diseñadas desde cero para ofrecerte el máximo rendimiento.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, width: '100%', maxWidth: 900, marginBottom: 60 }}>
        
        {/* Mobile APK */}
        <div className="card focusable rise-2" data-nav tabIndex={0} style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--line)', 
          borderRadius: 32, 
          padding: 40, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.3 }} />
          
          <div style={{ background: 'linear-gradient(135deg, var(--primary), #b14aed)', color: 'white', padding: 20, borderRadius: 24, marginBottom: 24, boxShadow: '0 10px 20px rgba(var(--primary-rgb), 0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.6rem', marginBottom: 12, fontFamily: 'var(--display)' }}>Edición Móvil</h3>
          <p style={{ fontSize: '1rem', color: 'var(--muted)', marginBottom: 32, textAlign: 'center', lineHeight: 1.5 }}>
            Optimizada para teléfonos y tablets Android. Controles táctiles fluidos y soporte para descargas offline.
          </p>
          <a 
            href="/downloads/akashiverse-mobile.apk" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px 0', fontSize: '1.1rem', borderRadius: 999, display: 'flex', justifyContent: 'center', gap: 10, textDecoration: 'none' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Descargar APK
          </a>
        </div>

        {/* TV APK */}
        <div className="card focusable rise-2" data-nav tabIndex={0} style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--line)', 
          borderRadius: 32, 
          padding: 40, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          animationDelay: '100ms',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 150, height: 150, background: 'var(--accent)', filter: 'blur(80px)', opacity: 0.2 }} />

          <div style={{ background: 'linear-gradient(135deg, var(--accent), #e67e22)', color: 'white', padding: 20, borderRadius: 24, marginBottom: 24, boxShadow: '0 10px 20px rgba(var(--accent-rgb), 0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
              <polyline points="17 2 12 7 7 2"></polyline>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.6rem', marginBottom: 12, fontFamily: 'var(--display)' }}>Edición Smart TV</h3>
          <p style={{ fontSize: '1rem', color: 'var(--muted)', marginBottom: 32, textAlign: 'center', lineHeight: 1.5 }}>
            Soporte nativo para D-Pad y controles remotos. Ideal para Android TV, Google TV y Fire TV Sticks.
          </p>
          <a 
            href="/downloads/akashiverse-tv.apk" 
            className="btn btn-outline" 
            style={{ width: '100%', padding: '16px 0', fontSize: '1.1rem', borderRadius: 999, display: 'flex', justifyContent: 'center', gap: 10, textDecoration: 'none' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Descargar APK TV
          </a>
        </div>

      </div>

      <div className="rise-2" style={{ animationDelay: '200ms', padding: '24px', background: 'rgba(150, 150, 150, 0.05)', borderRadius: 20, border: '1px solid var(--line)', maxWidth: 700, textAlign: 'center', fontSize: '0.95rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <p style={{ margin: 0, textAlign: 'left', lineHeight: 1.5 }}>
          <strong>Nota de instalación:</strong> Al instalar cualquiera de nuestros APKs, es posible que tu dispositivo te pida habilitar el permiso de <em>"Instalar aplicaciones de origen desconocido"</em>. Esto es completamente normal y seguro.
        </p>
      </div>
    </div>
  )
}
