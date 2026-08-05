import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, AlertCircle } from 'lucide-react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../../services/firebase';
import { useAnimeStore } from '../../store/useAnimeStore';

const LoginModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setUser = useAnimeStore((state) => state.setUser);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleProviderAuth = async (provider) => {
    if (!isFirebaseConfigured) {
      setError("Firebase no está configurado. Revisa tu archivo .env");
      return;
    }
    setError('');
    
    // ATENCIÓN: No usar setLoading(true) aquí porque rompe la cadena del evento de click,
    // lo que hace que los navegadores bloqueen la ventana emergente (PopupBlocker).
    try {
      const result = await signInWithPopup(auth, provider);
      setLoading(true);
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      onClose();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError('Ventana emergente bloqueada por el navegador. Permite las ventanas emergentes e inténtalo de nuevo.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Cancelaste el inicio de sesión.');
      } else {
        setError(err.message.includes('auth/') ? 'Error de autenticación' : err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      setError("Firebase no está configurado. Revisa tu archivo .env");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setError('');
    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, email, password);
      } else {
        result = await createUserWithEmailAndPassword(auth, email, password);
      }
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || email.split('@')[0],
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err.code === 'auth/invalid-credential' ? 'Credenciales incorrectas' : 
        err.code === 'auth/email-already-in-use' ? 'El correo ya está registrado' : 
        'Ha ocurrido un error al iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md max-h-[90vh] flex flex-col bg-background-main border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden z-[101] shadow-2xl"
          >
            {/* Header */}
            <div className="relative shrink-0 h-32 bg-gradient-to-br from-primary/30 via-background-secondary to-background-main flex items-center justify-center border-b border-black/5 dark:border-white/5">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all z-10"
              >
                <X size={16} />
              </button>
              <div className="text-center">
                <h2 className="text-3xl font-display font-black text-text-primary italic uppercase tracking-wider">
                  {isLogin ? 'Bienvenido' : 'Únete a Zenkai'}
                </h2>
                <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mt-1">
                  Tu progreso en la nube
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {error && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-xs font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Social Login */}
              <div className="flex mb-8">
                <button
                  type="button"
                  onClick={() => handleProviderAuth(googleProvider)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-black dark:text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.48-1.92.2-.92z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.18-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar con Google
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-black/5 dark:bg-white/5" />
                <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">o con correo</span>
                <div className="flex-1 h-px bg-black/5 dark:bg-white/5" />
              </div>

              {/* Email Login */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary pl-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-background-secondary border border-black/5 dark:border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-text-secondary/50"
                      placeholder="tu@correo.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary pl-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-background-secondary border border-black/5 dark:border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-text-secondary/50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {!isLogin && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary pl-1">Confirmar Contraseña</label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required={!isLogin}
                          className="w-full bg-background-secondary border border-black/5 dark:border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-text-secondary/50"
                          placeholder="••••••••"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-primary to-primary-hover hover:scale-[1.02] active:scale-[0.98] text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all mt-4 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </button>
              </form>

              <p className="mt-8 text-center text-xs text-text-secondary">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setConfirmPassword('');
                  }}
                  className="text-primary hover:text-primary-hover font-bold transition-colors ml-1"
                >
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                </button>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LoginModal;
