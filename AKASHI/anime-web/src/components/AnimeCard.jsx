import { Play, Calendar, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnimeCard = ({ anime }) => {
  const navigate = useNavigate();

  const handleDetails = () => {
    // Generar un ID simple basado en el título
    const id = (anime.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    navigate(`/anime/${id}?url=${encodeURIComponent(anime.url)}`);
  };

  return (
    <div 
      className="anime-card" 
      onClick={handleDetails}
      style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Thumbnail Container */}
      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
        <img 
          src={anime.image || 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?auto=format&fit=crop&q=80&w=500'} 
          alt={anime.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.8s ease'
          }}
          className="card-img"
        />
        
        {/* Rating Badge */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px', zIndex: 10,
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)',
          padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '0.8rem', fontWeight: 800
        }}>
          <Star size={14} color="#fbbf24" fill="#fbbf24" /> {anime.score || '8.5'}
        </div>

        {/* Play Overlay */}
        <div className="card-overlay" style={{
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'all 0.3s ease'
        }}>
          <div className="gradient-bg play-btn" style={{ 
            width: '60px', height: '60px', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(255, 61, 113, 0.5)',
            transform: 'scale(0.8)', transition: 'all 0.3s ease'
          }}>
            <Play size={24} color="white" fill="white" />
          </div>
        </div>
      </div>
      
      {/* Info Content */}
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 className="font-display" style={{ 
          fontSize: '1.1rem', fontWeight: 700, color: 'white', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {anime.title}
        </h4>
        
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ 
              fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px',
              background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px'
            }}>
              <Calendar size={12} /> {anime.type || 'TV'}
            </span>
            <span style={{ 
              fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 700,
              background: 'rgba(20, 184, 166, 0.1)', padding: '4px 8px', borderRadius: '6px'
            }}>
              {anime.episodes?.length || '??'} EPS
            </span>
          </div>
          
          <span style={{ 
            background: 'rgba(255, 61, 113, 0.15)', color: 'var(--primary)', 
            padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800,
            textTransform: 'uppercase', border: '1px solid rgba(255, 61, 113, 0.2)'
          }}>
            {anime.type === 'TV' ? 'Serie' : anime.type === 'Movie' ? 'Película' : (anime.type || 'TV')}
          </span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .anime-card:hover { border-color: var(--primary); transform: translateY(-8px); }
        .anime-card:hover .card-img { transform: scale(1.1); }
        .anime-card:hover .card-overlay { opacity: 1; }
        .anime-card:hover .play-btn { transform: scale(1); }
      `}} />
    </div>
  );
};

export default AnimeCard;
