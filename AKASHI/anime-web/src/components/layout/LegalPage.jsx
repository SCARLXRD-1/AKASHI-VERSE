import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const LegalPage = ({ title, subtitle, icon: Icon, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pb-32 lg:pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto relative z-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-8 text-sm font-bold group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </Link>

          <div className="flex items-center gap-5 mb-4">
            {Icon && (
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"
              >
                <Icon size={28} className="text-primary" />
              </motion.div>
            )}
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-5xl font-display font-black text-white tracking-tight"
              >
                {title}
              </motion.h1>
              {subtitle && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-text-secondary font-medium text-sm mt-1"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="max-w-4xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

/* Reusable Section Card */
export const Section = ({ title, icon: SectionIcon, children, className = '' }) => (
  <div className={`bg-background-secondary/50 rounded-2xl border border-white/5 p-6 md:p-8 backdrop-blur-sm ${className}`}>
    {title && (
      <div className="flex items-center gap-3 mb-5">
        {SectionIcon && (
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <SectionIcon size={18} className="text-primary" />
          </div>
        )}
        <h2 className="text-lg md:text-xl font-display font-black text-white tracking-tight">{title}</h2>
      </div>
    )}
    <div className="text-text-secondary text-sm leading-relaxed font-medium space-y-3">
      {children}
    </div>
  </div>
);

/* Accordion Item for FAQ */
export const AccordionItem = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden bg-background-secondary/30 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left group hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-white font-bold text-sm md:text-base">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors"
        >
          <span className="text-primary text-lg font-black leading-none">+</span>
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 md:px-6 md:pb-6 text-text-secondary text-sm leading-relaxed font-medium">
          {children}
        </div>
      </motion.div>
    </div>
  );
};



export default LegalPage;
