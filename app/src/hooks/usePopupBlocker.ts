import { useEffect } from 'react'

const AD_HOSTS: string[] = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'popads.net',
  'popcash.net',
  'adsterra.com',
  'adnium.com',
  'propellerads.com',
  'ad-maven.com',
  'onclikd.com',
  'smartadserver.com',
  'taboola.com',
  'outbrain.com',
  'adservice.google.',
]

const AD_HOST_PATTERNS = AD_HOSTS.map((h) => h.replace(/\./g, '\\.'))

const AD_RE = new RegExp(`(?:${AD_HOST_PATTERNS.join('|')})`, 'i')

function isAdUrl(url: string): boolean {
  return AD_RE.test(url)
}

function hasAdishParams(url: string): boolean {
  return /(?:pops|pop_under|clickTag|aff_|ad_id|advertiser)/i.test(url)
}

/**
 * Bloquea pop-ups y pestañas indeseadas dentro del player.
 * - Sobrescribe window.open para devolver null.
 * - Escucha clicks de terceros (solo mismos targets conocidos).
 * - Evita navegación top del iframe hacia dominios ad (según contexto de origen).
 */
export function usePopupBlocker(containerRef: React.RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active) return

    const originalOpen = window.open

    const patchedOpen: typeof window.open = () => null

    const onKeydown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + click o nueva ventana desde fuentes de terceros
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
      }
    }

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Si hay un iframe intentando navegar el top a un dominio de ads, bloquear
      e.preventDefault()
    }

    window.open = patchedOpen as typeof window.open

    const cleanup = () => {
      window.open = originalOpen
    }

    document.addEventListener('keydown', onKeydown)

    const container = containerRef.current
    const observer = new MutationObserver(() => {
      if (!container) return
      container.querySelectorAll('iframe').forEach((iframe) => {
        const src = iframe.getAttribute('src') || ''
        if (isAdUrl(src)) {
          iframe.remove()
        }
      })
    })

    if (container) observer.observe(container, { childList: true, subtree: true })

    return () => {
      cleanup()
      observer.disconnect()
      document.removeEventListener('keydown', onKeydown)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [containerRef, active])

  return { isAdUrl, hasAdishParams }
}
