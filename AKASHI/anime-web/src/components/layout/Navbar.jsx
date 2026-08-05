import { useState, useEffect, useRef } from 'react';
import { Search, Home, Compass, Bookmark, TrendingUp, Flame, Play, Clock, Sparkles, X, User, Menu, Calendar, LogOut } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import SearchDropdown from '../ui/SearchDropdown';
import ThemeSelector from '../ui/ThemeSelector';
import NotificationPanel from '../ui/NotificationPanel';
import LoginModal from '../auth/LoginModal';
import LogoutModal from '../auth/LogoutModal';
import { useAnimeStore } from '../../store/useAnimeStore';
import { auth, isFirebaseConfigured } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { useTV } from '../../hooks/useTV';

const Navbar = () => {
  const { isTV } = useTV();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const searchInputRef = useRef(null);
  
  const { user, setUser, clearAllData } = useAnimeStore();

  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
    }
  };

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
      isScrolled ? 'py-4 bg-background-main/80 backdrop-blur-2xl border-b border-white/5 shadow-lg shadow-black/5' : 'py-6 bg-transparent'
    }`}>
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group transition-all duration-300">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform overflow-hidden">
            <img src="/zenkai-logo.jpeg" alt="Zenkai Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-2xl font-black tracking-tighter text-white">
            ZENKAI<span className="text-primary italic">ANIME</span>
          </span>
        </Link>

        {/* Nav Links - Desktop */}
        <div className="hidden lg:flex items-center gap-8 font-bold text-sm tracking-wide">
          {['Inicio', 'Explorar', 'Populares', 'Historial', 'Calendario'].map((item) => {
            const path = item === 'Inicio' ? '/' : `/${item.toLowerCase()}`;
            const isActive = location.pathname === path;
            
            return (
              <Link 
                key={item}
                to={path}
                className={`relative text-text-secondary hover:text-white transition-colors py-2 group ${isActive ? 'text-white' : ''}`}
              >
                {item}
                {isTV ? (
                  isActive && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />
                ) : (
                  <motion.div 
                    className={`absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full origin-left ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'}`}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4 relative">
          <div className="relative z-50">
            {isTV ? (
              showSearch && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[min(400px,calc(100vw-48px))]">
                  <form onSubmit={handleSearch}>
                    <input 
                      ref={searchInputRef}
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar anime..."
                      className="w-full bg-background-secondary border border-white/10 rounded-full py-2 px-10 text-sm focus:border-primary outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <X 
                      size={16} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary"
                      onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                    />
                  </form>
                  <SearchDropdown
                    query={searchQuery}
                    isOpen={showSearch}
                    onClose={() => { setShowSearch(false); setSearchQuery(''); }}
                    inputRef={searchInputRef}
                  />
                </div>
              )
            ) : (
              <AnimatePresence>
                {showSearch && (
                  <motion.form 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'min(400px, calc(100vw - 48px))', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    onSubmit={handleSearch}
                    className="absolute right-0 top-1/2 -translate-y-1/2"
                  >
                    <input 
                      ref={searchInputRef}
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar anime..."
                      className="w-full bg-background-secondary border border-white/10 rounded-full py-2 px-10 text-sm focus:border-primary outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <X 
                      size={16} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary"
                      onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                    />
                    <SearchDropdown
                      query={searchQuery}
                      isOpen={showSearch}
                      onClose={() => { setShowSearch(false); setSearchQuery(''); }}
                      inputRef={searchInputRef}
                    />
                  </motion.form>
                )}
              </AnimatePresence>
            )}
            {!showSearch && (
              <button 
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-text-secondary hover:text-white"
              >
                <Search size={20} />
              </button>
            )}
          </div>
          <div className={`flex items-center gap-2 sm:gap-4 transition-all duration-300 ${showSearch ? 'hidden md:flex' : 'flex'}`}>
            <NotificationPanel />

            <ThemeSelector />

            {user ? (
              <div className="relative group cursor-pointer">
                <div className="flex items-center gap-2 p-1 pl-4 rounded-full bg-white/5 border border-white/10 hover:border-primary/50 transition-all">
                  <span className="text-xs font-bold text-white hidden sm:inline truncate max-w-[100px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-primary" />
                    )}
                  </div>
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto z-50">
                  <div className="bg-background-main border border-black/5 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden transform origin-top-right scale-95 group-hover:scale-100 transition-transform">
                    <Link to="/perfil" className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <User size={16} />
                      Mi Perfil
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border-t border-black/5 dark:border-white/5"
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 p-1 pl-4 rounded-full bg-white/5 border border-white/10 hover:border-primary/50 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-background-secondary border border-white/10 flex items-center justify-center overflow-hidden">
                  <User size={18} className="text-primary group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-bold mr-2 hidden sm:inline">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
    </nav>
  );
};

export default Navbar;
