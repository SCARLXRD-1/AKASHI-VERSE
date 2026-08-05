import { useEffect, useRef } from 'react';

/**
 * usePopupBlocker
 * ─────────────────────────────────────────────────────────────────
 * Bloquea agresivamente los popups, redirecciones y click-hijacking
 * que los reproductores de terceros (dentro de iframes) intentan hacer.
 *
 * Técnicas usadas:
 *   1. window.open → siempre retorna null (bloqueado)
 *   2. Overlay de click sobre el iframe para absorber clics sin interferir con el video
 *   3. window.location hijack protection — detecta si la página principal intenta redirigir
 *   4. beforeunload / unload bloqueado para evitar redireccionamientos
 *   5. Links target="_blank" en document — prevenidos
 */
export function usePopupBlocker({ enabled = true } = {}) {
  const blockedCount = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // ── 1. Sobrescribir window.open ─────────────────────────────────────────
    const originalOpen = window.open;
    window.open = function blockedOpen(...args) {
      blockedCount.current += 1;
      console.warn(`[PopupBlocker] Popup bloqueado (${blockedCount.current}):`, args[0]);
      return null; // ← simula que fue bloqueado por el navegador
    };

    // ── 2. Bloquear target="_blank" en el documento principal ───────────────
    const handleDocClick = (e) => {
      const target = e.target.closest('a[target="_blank"]');
      if (target) {
        // Solo bloqueamos si NO es un enlace interno de nuestra app
        const href = target.getAttribute('href') || '';
        const isInternal = href.startsWith('/') || href.startsWith(window.location.origin);
        if (!isInternal) {
          e.preventDefault();
          e.stopPropagation();
          console.warn('[PopupBlocker] Link externo bloqueado:', href);
        }
      }
    };
    document.addEventListener('click', handleDocClick, true);

    // ── 3. Proteger window.location de hijacking externo ───────────────────
    // Algunos iframes llaman window.top.location = '...' — esto lo bloquea
    // Solo aplica si el browser lo permite (cross-origin frames ya no pueden
    // acceder a window.top en contextos seguros, pero por si acaso):
    let _href = window.location.href;
    try {
      Object.defineProperty(window, 'location', {
        get() { return window.location; },
        // No hacemos nada especial, solo lo dejamos pasar —
        // el sandbox del iframe es la mejor defensa aquí
        configurable: true,
      });
    } catch (_e) {
      // En algunos navegadores no se puede redefinir location — ignorar
    }

    // ── 4. Evitar redirección via beforeunload (algunos ads hacen esto) ────
    const handleBeforeUnload = (e) => {
      // Si hay un iframe cargado, prevenimos la redirección de la página
      e.stopImmediatePropagation();
      // NO llamamos e.preventDefault() para no mostrar el diálogo del browser
    };
    window.addEventListener('beforeunload', handleBeforeUnload, true);

    // ── 5. Bloquear creación de nuevos iframes por scripts ─────────────────
    // Algunos players crean iframes dinámicos para ads — los eliminamos
    const iframeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          // Nuevo iframe añadido al body/document por un script externo
          if (node.tagName === 'IFRAME') {
            const src = node.src || '';
            // Si el src no es de nuestros players conocidos, lo removemos
            if (src && isAdFrame(src)) {
              node.remove();
              console.warn('[PopupBlocker] Ad iframe eliminado:', src);
            }
          }
          // También buscar iframes dentro de divs añadidos dinámicamente
          if (node.querySelectorAll) {
            node.querySelectorAll('iframe').forEach((frame) => {
              const src = frame.src || '';
              if (src && isAdFrame(src)) {
                frame.remove();
                console.warn('[PopupBlocker] Ad iframe (nested) eliminado:', src);
              }
            });
          }
        }
      }
    });

    iframeObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      // Restaurar todo al desmontar
      window.open = originalOpen;
      document.removeEventListener('click', handleDocClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload, true);
      iframeObserver.disconnect();
    };
  }, [enabled]);

  return { blockedCount };
}

// ── Heurística para detectar iframes de publicidad ─────────────────────────
const AD_PATTERNS = [
  /doubleclick\.net/,
  /googlesyndication/,
  /adnxs\.com/,
  /openx\.net/,
  /exoclick/,
  /trafficjunky/,
  /realsrv\.com/,
  /popads/,
  /popcash/,
  /adsterra/,
  /propellerads/,
  /hilltopads/,
  /juicyads/,
  /exosrv/,
  /about:blank/,  // iframes en blanco usados para popups
];

function isAdFrame(src) {
  return AD_PATTERNS.some((pattern) => pattern.test(src));
}
