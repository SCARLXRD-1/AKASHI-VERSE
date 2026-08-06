import { useEffect } from 'react'

/**
 * Navegación espacial estilo TV (Android TV / Google TV).
 * Mueve el foco entre elementos con data-nav=true usando
 * los rects de los elementos y el centro de cada uno.
 */
export function useSpatialNav(containerRef: React.RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    const getItems = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>('[data-nav]')).filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0,
      )

    const focusItem = (el: HTMLElement) => {
      el.focus()
      el.setAttribute('data-focus', 'true')
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    }

    const moveFocus = (direction: 'up' | 'down' | 'left' | 'right') => {
      const items = getItems()
      if (items.length === 0) return

      const current = (document.activeElement as HTMLElement | null) ?? items[0]
      const isCurrent = items.includes(current)
      const source = isCurrent ? current.getBoundingClientRect() : items[0].getBoundingClientRect()
      const sx = source.left + source.width / 2
      const sy = source.top + source.height / 2

      let best: HTMLElement | null = null
      let bestScore = Infinity

      for (const item of items) {
        const rect = item.getBoundingClientRect()
        const dx = rect.left + rect.width / 2 - sx
        const dy = rect.top + rect.height / 2 - sy

        let primary = 0
        let secondary = 0
        switch (direction) {
          case 'left':
            if (dx >= 0) continue
            primary = -dx
            secondary = Math.abs(dy)
            break
          case 'right':
            if (dx <= 0) continue
            primary = dx
            secondary = Math.abs(dy)
            break
          case 'up':
            if (dy >= 0) continue
            primary = -dy
            secondary = Math.abs(dx)
            break
          case 'down':
            if (dy <= 0) continue
            primary = dy
            secondary = Math.abs(dx)
            break
        }

        const score = primary + secondary * 2.5
        if (score < bestScore) {
          bestScore = score
          best = item
        }
      }

      if (best) focusItem(best)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      // Los select nativos necesitan sus propias flechas y Enter para abrir
      // y recorrer las opciones, incluso en Android TV.
      if (document.activeElement?.tagName === 'SELECT') return
      const key = e.key
      if (key === 'ArrowUp') {
        e.preventDefault()
        moveFocus('up')
      } else if (key === 'ArrowDown') {
        e.preventDefault()
        moveFocus('down')
      } else if (key === 'ArrowLeft') {
        e.preventDefault()
        moveFocus('left')
      } else if (key === 'ArrowRight') {
        e.preventDefault()
        moveFocus('right')
      } else if (key === 'Enter' || key === ' ') {
        const el = document.activeElement as HTMLElement | null
        if (el && el.dataset.nav && el.tagName !== 'INPUT') {
          e.preventDefault()
          el.click()
        }
      }
    }

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.dataset?.nav) {
        getItems().forEach((el) => el.removeAttribute('data-focus'))
        target.setAttribute('data-focus', 'true')
      }
    }

    document.addEventListener('keydown', onKey)
    container.addEventListener('focusin', onFocusIn)

    const first = getItems()[0]
    if (first) first.setAttribute('data-focus', 'true')

    return () => {
      document.removeEventListener('keydown', onKey)
      container.removeEventListener('focusin', onFocusIn)
    }
  }, [containerRef, enabled])
}
