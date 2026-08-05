import { useCallback, useEffect, useRef, useState } from 'react'

export interface AutoplayOptions {
  countdown?: number
  onNext: () => void
  enabled?: boolean
}

/**
 * Cuenta regresiva estilo Netflix tras terminar el episodio.
 * - El jugador debe llamar `trigger()` cuando ocurra el evento `ended`.
 * - Emite el callback onNext cuando llega a 0 (o Enter/click en "Reproducir").
 * - `cancel()` detiene el countdown.
 */
export function useAutoplay({ countdown = 10, onNext, enabled = true }: AutoplayOptions) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const onNextRef = useRef(onNext)
  onNextRef.current = onNext

  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const countdownRef = useRef(countdown)
  countdownRef.current = countdown

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  const stop = useCallback(() => {
    clearTimer()
    setRemaining(null)
  }, [clearTimer])

  const trigger = useCallback(() => {
    if (!enabledRef.current) return
    clearTimer()
    setRemaining(countdownRef.current)
    timer.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null) return null
        if (prev <= 1) {
          clearTimer()
          setTimeout(() => onNextRef.current(), 0)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer])

  useEffect(() => clearTimer, [])

  return { remaining, trigger, cancel: stop, playNext: () => { stop(); onNextRef.current() } }
}
