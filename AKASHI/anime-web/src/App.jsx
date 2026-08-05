import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { useAnimeStore } from './store/useAnimeStore';
import { auth, isFirebaseConfigured } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserData, syncUserData } from './services/db';
import { Toaster } from 'sileo';

const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const AnimeDetail = lazy(() => import('./pages/AnimeDetail'));
const Watch = lazy(() => import('./pages/Watch'));
const Search = lazy(() => import('./pages/Search'));
const History = lazy(() => import('./pages/History'));
const MyList = lazy(() => import('./pages/MyList'));
const ProfileStats = lazy(() => import('./pages/ProfileStats'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Downloads = lazy(() => import('./pages/Downloads'));
const Terms = lazy(() => import('./pages/legal/Terms'));
const Privacy = lazy(() => import('./pages/legal/Privacy'));
const FAQ = lazy(() => import('./pages/legal/FAQ'));
const Contact = lazy(() => import('./pages/legal/Contact'));
const DMCA = lazy(() => import('./pages/legal/DMCA'));

import { GlobalLoader, PageLoader } from './components/ui/GlobalLoader';

function App() {
  const setUser = useAnimeStore((state) => state.setUser);
  const loadUserData = useAnimeStore((state) => state.loadUserData);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
          
          // Fetch cloud data and merge
          const cloudData = await getUserData(user.uid);
          if (cloudData) {
            loadUserData(cloudData);
          } else {
            // First time login: sync current guest data to cloud
            const currentState = useAnimeStore.getState();
            syncUserData(user.uid, {
              favorites: currentState.favorites,
              history: currentState.history,
              totalEpisodesWatched: currentState.totalEpisodesWatched,
              dailyActivity: currentState.dailyActivity,
              genreStats: currentState.genreStats
            });
          }
        } else {
          setUser(null);
        }
      });
      return () => unsubscribe();
    }
  }, [setUser]);

  return (
    <Router>
      <Toaster theme="dark" position="top-right" offset={{ top: "70px", right: "24px" }} />
      <GlobalLoader />
      <Suspense fallback={<PageLoader />}>
        <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="explorar" element={<Explore />} />
              <Route path="populares" element={<Explore defaultOrder="rating" />} />
              <Route path="calendario" element={<Calendar />} />
            <Route path="anime/:id" element={<AnimeDetail />} />
            <Route path="watch/:id" element={<Watch />} />
            <Route path="search" element={<Search />} />
            <Route path="historial" element={<History />} />
            <Route path="mi-lista" element={<MyList />} />
            <Route path="perfil" element={<ProfileStats />} />
            <Route path="descargas" element={<Downloads />} />
            
            {/* Legal / Support Routes */}
            <Route path="terminos" element={<Terms />} />
            <Route path="privacidad" element={<Privacy />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="contacto" element={<Contact />} />
            <Route path="dmca" element={<DMCA />} />
            
            {/* Fallback for other routes */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
                <h1 className="text-9xl font-black text-white/5 italic select-none">404</h1>
                <div className="space-y-2 relative z-10 -mt-20">
                  <h2 className="text-4xl font-black text-white italic">Zona Desconocida</h2>
                  <p className="text-text-secondary font-bold">El contenido que buscas ha sido absorbido por el vacío.</p>
                </div>
              </div>
            } />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
