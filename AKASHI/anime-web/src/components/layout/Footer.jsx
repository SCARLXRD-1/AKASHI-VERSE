import { Send, Globe, Heart, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full relative z-20 bg-background-secondary border-t border-white/5 pt-16 pb-32 lg:pb-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-xl italic">Z</span>
              </div>
              <span className="font-display text-2xl font-black tracking-tighter text-white">
                ZENKAI<span className="text-primary italic">ANIME</span>
              </span>
            </Link>
            <p className="text-text-secondary leading-relaxed text-sm font-medium">
              La plataforma de streaming definitiva para fans del anime. Calidad premium, 
              interfaz moderna y una comunidad apasionada.
            </p>
            <div className="flex gap-4">
              {[Share2, Globe, Send].map((Icon, i) => (
                <button key={i} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-all">
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-black text-white mb-6 uppercase tracking-widest text-[10px]">Navegación</h4>
            <ul className="space-y-4 font-bold text-xs text-text-secondary">
              {['Inicio', 'Explorar', 'Populares', 'Calendario', 'Mi Lista'].map(item => {
                const path = item === 'Inicio' ? '/' : 
                             item === 'Explorar' ? '/explorar' : 
                             item === 'Populares' ? '/populares' : 
                             item === 'Calendario' ? '/calendario' : '/mi-lista';
                return <li key={item}><Link to={path} className="hover:text-primary transition-colors">{item}</Link></li>
              })}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-black text-white mb-6 uppercase tracking-widest text-[10px]">Soporte</h4>
            <ul className="space-y-4 font-bold text-xs text-text-secondary">
              {['Preguntas Frecuentes', 'Términos de Uso', 'Política de Privacidad', 'Contacto', 'DMCA'].map(item => {
                const path = item === 'Preguntas Frecuentes' ? '/faq' : 
                             item === 'Términos de Uso' ? '/terminos' : 
                             item === 'Política de Privacidad' ? '/privacidad' : 
                             item === 'Contacto' ? '/contacto' : '/dmca';
                return <li key={item}><Link to={path} className="hover:text-primary transition-colors">{item}</Link></li>
              })}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-display font-black text-white mb-6 uppercase tracking-widest text-[10px]">Newsletter</h4>
            <p className="text-xs text-text-secondary font-bold">Recibe actualizaciones sobre los nuevos episodios de tus series favoritas.</p>
            <div className="relative">
              <input 
                type="email" 
                placeholder="tu@email.com"
                className="w-full bg-background-main border border-white/10 rounded-2xl py-3 px-4 text-xs focus:border-primary outline-none"
              />
              <button className="absolute right-2 top-1.5 bottom-1.5 bg-primary text-white rounded-xl px-4 text-[10px] font-black uppercase tracking-widest hover:bg-primary/80 transition-colors">
                Unirse
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">
          <p>© {new Date().getFullYear()} ZENKAI ANIME. Todos los derechos reservados.</p>
          <p className="flex items-center gap-2">
            Realizado por <span className="text-primary">AKASHI DEV</span>
          </p>
          <p className="flex items-center gap-2">
            Hecho con <Heart size={12} className="text-primary fill-primary" /> por el equipo de Zenkai.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
