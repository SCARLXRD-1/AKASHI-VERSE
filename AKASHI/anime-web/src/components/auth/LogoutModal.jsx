import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { useAnimeStore } from '../../store/useAnimeStore';

const LogoutModal = ({ isOpen, onClose }) => {
  const { setUser, clearAllData } = useAnimeStore();

  const handleConfirmLogout = async () => {
    try {
      if (isFirebaseConfigured) {
        await signOut(auth);
      }
      setUser(null);
      if (clearAllData) clearAllData();
      onClose();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("No se pudo cerrar sesión. Inténtalo de nuevo.");
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm flex flex-col bg-background-main border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden z-[101] shadow-2xl p-6"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 flex items-center justify-center text-text-secondary hover:text-text-primary transition-all z-10"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                <LogOut size={32} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-display font-black text-white italic tracking-tight mb-2">
                ¿Cerrar sesión?
              </h2>
              <p className="text-sm text-text-secondary mb-6 font-medium">
                Pasarás a modo invitado. Tus datos locales se conservarán, pero no se sincronizarán con la nube.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 text-sm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LogoutModal;
