import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import TopBar from './components/TopBar'
import Footer from './components/Footer'
import Home from './pages/Home'

const Catalog = lazy(() => import('./pages/Catalog'))
const Detail = lazy(() => import('./pages/Detail'))
const AnimeDetail = lazy(() => import('./pages/AnimeDetail'))
const Watch = lazy(() => import('./pages/Watch'))
const History = lazy(() => import('./pages/History'))
const LiveTv = lazy(() => import('./pages/LiveTv'))
const Apps = lazy(() => import('./pages/Apps'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function SuspenseRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="spinner" role="status" aria-label="Cargando" />}>{children}</Suspense>
}

function CapacitorBackButton() {
  const navigate = useNavigate()
  
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).Capacitor) return
    
    let lastTime = 0
    const listener = CapacitorApp.addListener('backButton', (info) => {
      if (info.canGoBack) {
        navigate(-1)
      } else {
        const now = Date.now()
        if (now - lastTime < 2000) {
          CapacitorApp.exitApp()
        } else {
          lastTime = now
        }
      }
    })
    
    return () => {
      listener.then(l => l.remove()).catch(() => {})
    }
  }, [navigate])
  
  return null
}

function Layout() {
  return (
    <div className="app">
      <CapacitorBackButton />
      <TopBar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/peliculas" element={<SuspenseRoute><Catalog kind="peliculas" /></SuspenseRoute>} />
          <Route path="/series" element={<SuspenseRoute><Catalog kind="series" /></SuspenseRoute>} />
          <Route path="/anime" element={<SuspenseRoute><Catalog kind="anime" /></SuspenseRoute>} />
          <Route path="/detalle" element={<SuspenseRoute><Detail /></SuspenseRoute>} />
          <Route path="/anime-detalle" element={<SuspenseRoute><AnimeDetail /></SuspenseRoute>} />
          <Route path="/ver" element={<SuspenseRoute><Watch /></SuspenseRoute>} />
          <Route path="/historial" element={<SuspenseRoute><History /></SuspenseRoute>} />
          <Route path="/tv" element={<SuspenseRoute><LiveTv /></SuspenseRoute>} />
          <Route path="/apps" element={<SuspenseRoute><Apps /></SuspenseRoute>} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout />
    </BrowserRouter>
  )
}
