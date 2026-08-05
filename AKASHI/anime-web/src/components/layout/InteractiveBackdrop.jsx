import { useEffect, useRef } from 'react';
import { useTV } from '../../hooks/useTV';

const InteractiveBackdrop = () => {
  const { isTV } = useTV();
  const backdropRef = useRef(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const frameRef = useRef(null);

  useEffect(() => {
    if (isTV) return;
    const backdrop = backdropRef.current;
    if (!backdrop) return;

    const updatePointer = (event) => {
      pointerRef.current = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      };

      if (frameRef.current) return;

      frameRef.current = window.requestAnimationFrame(() => {
        const { x, y } = pointerRef.current;
        backdrop.style.setProperty('--pointer-x', `${x * 100}%`);
        backdrop.style.setProperty('--pointer-y', `${y * 100}%`);
        backdrop.style.setProperty('--drift-x', `${(x - 0.5) * 44}px`);
        backdrop.style.setProperty('--drift-y', `${(y - 0.5) * 44}px`);
        frameRef.current = null;
      });
    };

    window.addEventListener('pointermove', updatePointer, { passive: true });

    return () => {
      window.removeEventListener('pointermove', updatePointer);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [isTV]);

  if (isTV) return null;

  return (
    <div ref={backdropRef} className="interactive-backdrop" aria-hidden="true">
      <div className="interactive-backdrop__dots interactive-backdrop__dots--far" />
      <div className="interactive-backdrop__dots interactive-backdrop__dots--near" />
      <div className="interactive-backdrop__glow" />
    </div>
  );
};

export default InteractiveBackdrop;
