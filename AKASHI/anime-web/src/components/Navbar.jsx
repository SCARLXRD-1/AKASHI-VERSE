import { Search, TrendingUp, Home, Tv, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = ({ onNavigate }) => {
  const location = useLocation();

  return (
    <nav className="glass" style={{
      position: 'fixed',
      top: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '95%',
      maxWidth: '1300px',
      zIndex: 1000,
      padding: '0.6rem 2rem',
      borderRadius: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div 
        onClick={() => onNavigate('/', 'back')} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
      >
        <div className="gradient-bg" style={{ 
          padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
        }}>
          <Tv size={20} color="white" strokeWidth={2.5} />
        </div>
        <div className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
          AKASHI <span style={{ color: 'var(--primary)' }}>ANIME</span>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        alignItems: 'center',
        background: 'rgba(255,255,255,0.03)',
        padding: '0.4rem',
        borderRadius: '16px'
      }}>
        <NavItem 
          onClick={() => onNavigate('/', location.pathname === '/' ? 'none' : 'back')} 
          active={location.pathname === '/'}
          icon={<Home size={18} />}
          label="Inicio"
        />
        <NavItem 
          onClick={() => onNavigate('/search', 'forward')} 
          active={location.pathname === '/search'}
          icon={<Search size={18} />}
          label="Explorar"
        />
        <NavItem 
          onClick={() => onNavigate('/trending', 'forward')} 
          active={location.pathname === '/trending'}
          icon={<TrendingUp size={18} />}
          label="Tendencias"
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="glass" style={{ 
          width: '40px', height: '40px', borderRadius: '14px', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
        }}>
          <Bell size={18} />
        </button>
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
        <button className="gradient-bg" style={{ 
          padding: '0.6rem 1.2rem', borderRadius: '14px', fontSize: '0.85rem', 
          fontWeight: 700, color: 'white', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
        }}>
          Iniciar Sesión
        </button>
      </div>
    </nav>
  );
};

const NavItem = ({ onClick, active, icon, label }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      fontSize: '0.9rem',
      fontWeight: active ? 700 : 500,
      color: active ? 'white' : 'var(--text-muted)',
      cursor: 'pointer',
      padding: '0.6rem 1.2rem',
      borderRadius: '12px',
      background: active ? 'var(--primary)' : 'transparent',
      boxShadow: active ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
      transition: 'var(--transition-smooth)'
    }}
  >
    {icon}
    <span style={{ display: active ? 'inline' : 'none' }}>{label}</span>
  </div>
);

export default Navbar;
