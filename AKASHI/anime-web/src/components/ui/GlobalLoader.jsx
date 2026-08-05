import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════════
   ZENKAI ENGINE — Cinematic Boot Sequence
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Particle Field (Canvas) ────────────────────────────────────────────────
const ParticleCanvas = ({ progress }) => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = globalThis.innerWidth;
      canvas.height = globalThis.innerHeight;
    };
    resize();
    globalThis.addEventListener('resize', resize);

    // Initialize particles
    const PARTICLE_COUNT = 120;
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.6 + 0.1,
      hue: Math.random() > 0.6 ? 270 : 190, // purple or cyan
      pulse: Math.random() * Math.PI * 2,
    }));

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    globalThis.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      particles.current.forEach((p, i) => {
        p.pulse += 0.02;
        const pulseFactor = Math.sin(p.pulse) * 0.3 + 0.7;

        // Gravitate toward center as progress increases
        const prog = progress / 100;
        const pullStrength = prog * 0.02;
        const dx = cx - p.x;
        const dy = cy - p.y;
        p.vx += dx * pullStrength * 0.001;
        p.vy += dy * pullStrength * 0.001;

        // Mouse repulsion
        const mdx = p.x - mouseRef.current.x;
        const mdy = p.y - mouseRef.current.y;
        const mDist = Math.hypot(mdx, mdy);
        if (mDist < 120) {
          const force = (120 - mDist) / 120 * 0.5;
          p.vx += (mdx / mDist) * force;
          p.vy += (mdy / mDist) * force;
        }

        // Friction
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw
        const alpha = p.opacity * pulseFactor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulseFactor, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${alpha})`;
        ctx.fill();

        // Draw glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulseFactor * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${alpha * 0.15})`;
        ctx.fill();

        // Draw connections to nearby particles
        for (let j = i + 1; j < particles.current.length; j++) {
          const p2 = particles.current[j];
          const connDx = p.x - p2.x;
          const connDy = p.y - p2.y;
          const dist = Math.hypot(connDx, connDy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${p.hue}, 70%, 60%, ${(1 - dist / 100) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      globalThis.removeEventListener('resize', resize);
      globalThis.removeEventListener('mousemove', handleMouseMove);
    };
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ opacity: 0.7 }}
    />
  );
};

ParticleCanvas.propTypes = {
  progress: PropTypes.number.isRequired,
};

// ── Electricity / Lightning bolts ──────────────────────────────────────────
const LightningBolt = ({ delay = 0, side = 'left' }) => {
  const [visible, setVisible] = useState(false);
  const pathRef = useRef('');

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(true);
      // Generate a random lightning path
      const startX = side === 'left' ? 0 : 100;
      const endX = 50;
      let path = `M ${startX} ${Math.random() * 30 + 35}`;
      const segments = 6 + Math.floor(Math.random() * 4);
      for (let i = 1; i <= segments; i++) {
        const x = startX + ((endX - startX) * i) / segments + (Math.random() - 0.5) * 15;
        const y = 35 + (Math.random() - 0.5) * 30 + 15;
        path += ` L ${x} ${y}`;
      }
      pathRef.current = path;
      setTimeout(() => setVisible(false), 150 + Math.random() * 100);
    }, 2000 + Math.random() * 3000 + delay);

    return () => clearInterval(interval);
  }, [side, delay]);

  if (!visible) return null;

  return (
    <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d={pathRef.current}
        fill="none"
        stroke="url(#lightning-grad)"
        strokeWidth="0.4"
        filter="url(#glow)"
        opacity="0.8"
      />
      <path
        d={pathRef.current}
        fill="none"
        stroke="#fff"
        strokeWidth="0.15"
        opacity="0.9"
      />
      <defs>
        <linearGradient id="lightning-grad">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};

LightningBolt.propTypes = {
  delay: PropTypes.number,
  side: PropTypes.oneOf(['left', 'right']),
};

// ── Orbital Rings ──────────────────────────────────────────────────────────
const OrbitalRings = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute rounded-full border"
        style={{
          width: `${180 + i * 60}px`,
          height: `${180 + i * 60}px`,
          borderColor: i === 1 ? 'rgba(0, 229, 255, 0.15)' : 'rgba(124, 58, 237, 0.12)',
          borderWidth: '1px',
          borderStyle: i === 2 ? 'dashed' : 'solid',
        }}
        initial={{ rotate: i * 60, scale: 0, opacity: 0 }}
        animate={{
          rotate: [i * 60, i * 60 + (i % 2 === 0 ? 360 : -360)],
          scale: 1,
          opacity: 1,
          rotateX: 65 + i * 5,
        }}
        transition={{
          rotate: { repeat: Infinity, duration: 8 + i * 4, ease: 'linear' },
          scale: { duration: 1.2, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.6, delay: 0.3 + i * 0.15 },
        }}
      >
        {/* Orbiting dot */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: i === 1 ? '6px' : '4px',
            height: i === 1 ? '6px' : '4px',
            background: i === 1 ? '#00E5FF' : '#7C3AED',
            boxShadow: i === 1 ? '0 0 12px #00E5FF' : '0 0 12px #7C3AED',
            top: '-2px',
            left: '50%',
            marginLeft: '-2px',
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 + i * 0.5, ease: 'easeInOut' }}
        />
      </motion.div>
    ))}
  </div>
);

// ── Glitch Text Effect ─────────────────────────────────────────────────────
const GlitchText = ({ text, className = '' }) => {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      {glitching && (
        <>
          <span
            className="absolute inset-0 z-20"
            style={{
              color: '#00E5FF',
              clipPath: 'inset(20% 0 30% 0)',
              transform: 'translateX(2px)',
            }}
          >
            {text}
          </span>
          <span
            className="absolute inset-0 z-20"
            style={{
              color: '#7C3AED',
              clipPath: 'inset(60% 0 0 0)',
              transform: 'translateX(-2px)',
            }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
};

GlitchText.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
};

// ── Progress Bar with Plasma Effect ────────────────────────────────────────
const PlasmaProgressBar = ({ progress }) => (
  <div className="relative w-72 sm:w-80 h-1.5 rounded-full overflow-hidden bg-white/5 backdrop-blur-sm border border-white/5">
    <motion.div
      className="absolute inset-y-0 left-0 rounded-full"
      style={{
        background: 'linear-gradient(90deg, #7C3AED, #a855f7, #00E5FF, #7C3AED)',
        backgroundSize: '200% 100%',
      }}
      initial={{ width: '0%' }}
      animate={{
        width: `${progress}%`,
        backgroundPosition: ['0% 0%', '200% 0%'],
      }}
      transition={{
        width: { duration: 0.4, ease: 'easeOut' },
        backgroundPosition: { repeat: Infinity, duration: 2, ease: 'linear' },
      }}
    />
    {/* Glow on the tip */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(0,229,255,0.6), transparent 70%)',
        left: `${progress}%`,
        marginLeft: '-12px',
        filter: 'blur(4px)',
      }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
    />
  </div>
);

PlasmaProgressBar.propTypes = {
  progress: PropTypes.number,
};

// ── Loading Messages ───────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  'Conectando al Portal Dimensional...',
  'Sincronizando con servidores de anime...',
  'Cargando catálogo de temporadas...',
  'Estableciendo enlace seguro...',
  'Preparando motor de streaming...',
  'Inicializando interfaz Zenkai...',
  '¡Casi listo, prepara las palomitas!',
];

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN LOADER
// ═══════════════════════════════════════════════════════════════════════════

export const GlobalLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const [logoRevealed, setLogoRevealed] = useState(false);

  useEffect(() => {
    // Simulate boot progress with dramatic pacing
    let frame = 0;
    const totalFrames = 120; // ~5 seconds
    const interval = setInterval(() => {
      frame++;
      const t = frame / totalFrames;

      // Custom pacing: fast start → dramatic pause at 60-75% → fast finish
      let eased;
      if (t < 0.35) {
        // Quick ramp to ~55%
        eased = (t / 0.35) * 0.55;
      } else if (t < 0.65) {
        // Slow crawl from 55% → 75% (the dramatic "loading" zone)
        const localT = (t - 0.35) / 0.3;
        eased = 0.55 + localT * 0.2;
      } else {
        // Fast finish from 75% → 100%
        const localT = (t - 0.65) / 0.35;
        eased = 0.75 + localT * localT * 0.25;
      }

      setProgress(Math.min(eased * 100, 100));

      if (frame >= totalFrames) {
        clearInterval(interval);
        setTimeout(() => setIsLoading(false), 800);
      }
    }, 42);

    // Cycle loading messages
    const msgInterval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1800);

    // Reveal logo with delay
    setTimeout(() => setLogoRevealed(true), 400);

    return () => {
      clearInterval(interval);
      clearInterval(msgInterval);
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at center, #12101f 0%, #0a0a0f 70%, #050507 100%)' }}
        >
          {/* Particle background */}
          <ParticleCanvas progress={progress} />

          {/* Lightning bolts */}
          <LightningBolt delay={0} side="left" />
          <LightningBolt delay={1200} side="right" />
          <LightningBolt delay={600} side="left" />

          {/* Orbital rings */}
          <OrbitalRings />

          {/* Central glow */}
          <motion.div
            className="absolute z-5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 0.5, 0.3] }}
            transition={{ duration: 2, ease: 'easeOut' }}
            style={{
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(0,229,255,0.08) 40%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(40px)',
            }}
          />

          {/* Main content */}
          <div className="relative z-20 flex flex-col items-center gap-8">
            {/* Logo image with energy burst */}
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180 }}
              animate={logoRevealed ? { scale: 1, rotate: 0 } : {}}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            >
              {/* Energy burst behind logo */}
              <motion.div
                className="absolute inset-0 z-0"
                style={{
                  width: '100px',
                  height: '100px',
                  margin: '-10px',
                  background: 'conic-gradient(from 0deg, #7C3AED, #00E5FF, #7C3AED)',
                  borderRadius: '24px',
                  filter: 'blur(15px)',
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              />
              {/* Logo */}
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-primary/50">
                <img src="/zenkai-logo.jpeg" alt="Zenkai" className="w-full h-full object-cover" />
              </div>
            </motion.div>

            {/* Brand text with staggered reveal */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                className="overflow-hidden"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter">
                  <GlitchText text="ZENKAI" className="text-white" />
                  <GlitchText text="ANIME" className="text-primary italic" />
                </h1>
              </motion.div>

              {/* Subtitle with typing effect look */}
              <motion.p
                className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                Streaming Engine
              </motion.p>
            </div>

            {/* Progress section */}
            <motion.div
              className="flex flex-col items-center gap-4 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <PlasmaProgressBar progress={progress} />

              {/* Progress percentage */}
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-xs font-mono font-black text-accent tabular-nums"
                  key={Math.round(progress)}
                >
                  {Math.round(progress)}%
                </motion.span>
                <span className="w-px h-3 bg-white/10" />
                {/* Loading message */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={messageIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-[11px] font-bold text-text-secondary"
                  >
                    {LOADING_MESSAGES[messageIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Bottom decorative dots */}
            <motion.div
              className="flex items-center gap-2 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/60"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  PAGE LOADER (route transitions)
// ═══════════════════════════════════════════════════════════════════════════

export const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
    <div className="relative">
      {/* Outer ring */}
      <motion.div
        className="w-20 h-20 rounded-full border-2 border-primary/20"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        style={{ borderTopColor: '#7C3AED' }}
      />
      {/* Inner ring */}
      <motion.div
        className="absolute inset-2 rounded-full border-2 border-accent/20"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        style={{ borderTopColor: '#00E5FF' }}
      />
      {/* Center dot */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      >
        <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
      </motion.div>
    </div>
    <div className="flex flex-col items-center gap-2">
      <p className="font-display font-black text-lg text-white italic tracking-widest uppercase">
        Cargando...
      </p>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-4 rounded-full bg-primary/40"
            animate={{ scaleY: [0.5, 1.5, 0.5], opacity: [0.3, 1, 0.3] }}
            transition={{
              repeat: Infinity,
              duration: 0.8,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  </div>
);
