import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useSpatialNav } from '../hooks/useSpatialNav'

export default function TopBar() {
  const navRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  useSpatialNav(navRef, false)

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuOpen && !(e.target as Element).closest('.topbar')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuOpen])

  // Cerrar menú en resize a desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setMenuOpen(false) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark
    setIsDark(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const isNativeApp = typeof window !== 'undefined' && Capacitor.isNativePlatform()

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/peliculas', label: 'Películas' },
    { to: '/series', label: 'Series' },
    { to: '/anime', label: 'Anime' },
    { to: '/tv', label: 'TV en vivo' },
    { to: '/favoritos', label: 'Favoritos' },
    { to: '/historial', label: 'Historial' },
  ]



  return (
    <header className="topbar">
      {/* Logo */}
      <a href="/" className="brand">
        <img src="/logo.png" alt="AkashiVerse" className="logo" />
      </a>

      {/* Nav desktop */}
      <nav ref={navRef} className="nav nav-desktop" aria-label="Principal">
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            data-nav
            end={to === '/'}
          >
            {label}
          </NavLink>
        ))}
      </nav>



      {/* Right actions */}
      <div className="topbar-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', justifySelf: 'end' }}>
        {/* Descargar App Button - solo visible en web, no en app nativa */}
        {!isNativeApp && (
          <NavLink to="/apps" className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '0.9rem', textDecoration: 'none' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span className="hide-mobile">Descargar App</span>
          </NavLink>
        )}

        {/* Theme toggle */}
        <button
          className="theme-toggle focusable"
          onClick={toggleTheme}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-pressed={isDark}
          data-nav
        >
          <svg className="moon-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg className="sun-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </button>
      </div>

      {/* Hamburger (solo móvil) */}
      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuOpen}
      >
        <span className={`ham-bar ${menuOpen ? 'open' : ''}`} />
        <span className={`ham-bar ${menuOpen ? 'open' : ''}`} />
        <span className={`ham-bar ${menuOpen ? 'open' : ''}`} />
      </button>

      {/* Drawer móvil */}
      {menuOpen && (
        <nav className="nav-mobile" aria-label="Menú móvil">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-mobile-item ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
              end={to === '/'}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}