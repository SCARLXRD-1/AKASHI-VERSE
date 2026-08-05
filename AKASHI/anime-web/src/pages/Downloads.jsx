import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Tv, Download, ChevronRight, ShieldCheck, Zap, Layers } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Downloads = () => {
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <Helmet>
        <title>Descargar Zenkai Anime | Aplicaciones Nativas</title>
      </Helmet>

      {/* Hero Section */}
      <section className="relative px-6 pt-12 pb-16 lg:pt-24 lg:pb-24 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
          >
            <Zap size={16} />
            <span>Lleva Zenkai a todas partes</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60 tracking-tight"
          >
            Descarga la App de <span className="text-primary">Zenkai</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-text-secondary leading-relaxed"
          >
            Disfruta de la mejor experiencia de streaming de anime directamente en tu dispositivo favorito. Rápido, seguro y sin interrupciones.
          </motion.p>
        </div>
      </section>

      {/* Downloads Grid */}
      <section className="px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Mobile App Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative group p-1 bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative h-full bg-background-secondary/80 backdrop-blur-xl rounded-[2.4rem] p-8 lg:p-10 border border-white/5 flex flex-col">
              
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-8 text-primary shadow-lg shadow-primary/20">
                <Smartphone size={32} />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">Android Móvil</h2>
              <p className="text-text-secondary mb-8 flex-1">
                Optimizado para pantallas táctiles. Guarda tus favoritos, navega con fluidez y lleva tu catálogo de anime en el bolsillo.
              </p>
              
              <ul className="space-y-3 mb-10">
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <ShieldCheck size={18} className="text-primary" />
                  <span>Seguro y libre de virus</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <Layers size={18} className="text-primary" />
                  <span>Interfaz adaptable y modo oscuro</span>
                </li>
              </ul>
              
              <a
                href="https://www.upload-apk.com/scEHENe1FwUcSkD"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full relative flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary text-white font-bold text-lg overflow-hidden group/btn hover:shadow-[0_0_40px_rgba(var(--color-primary),0.4)] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                <Download size={20} className="relative z-10" />
                <span className="relative z-10">Descargar APK</span>
              </a>
            </div>
          </motion.div>

          {/* Android TV Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative group p-1 bg-gradient-to-b from-white/5 to-transparent rounded-[2.5rem] overflow-hidden"
          >
            <div className="relative h-full bg-background-secondary/50 backdrop-blur-xl rounded-[2.4rem] p-8 lg:p-10 border border-white/5 flex flex-col">
              
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 text-white/50">
                <Tv size={32} />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                Android TV 
                <span className="text-[10px] font-black tracking-widest uppercase bg-primary/20 text-primary px-2 py-1 rounded-md">Nuevo</span>
              </h2>
              <p className="text-text-secondary mb-8 flex-1">
                La experiencia definitiva en pantalla grande. Estamos trabajando para adaptar Zenkai a tu televisor inteligente.
              </p>
              
              <ul className="space-y-3 mb-10">
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <ShieldCheck size={18} />
                  <span>Control por mando a distancia</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <Layers size={18} />
                  <span>Interfaz de TV inmersiva</span>
                </li>
              </ul>
              
              <a
                href="/downloads/zenkai-anime-tv.apk"
                download="ZenkaiAnimeTV.apk"
                className="w-full relative flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/10 text-white font-bold text-lg overflow-hidden group/btn hover:bg-white/20 transition-all duration-300"
              >
                <Download size={20} className="relative z-10" />
                <span className="relative z-10">Descargar APK TV</span>
              </a>
            </div>
          </motion.div>

        </div>
      </section>
    </div>
  );
};

export default Downloads;
