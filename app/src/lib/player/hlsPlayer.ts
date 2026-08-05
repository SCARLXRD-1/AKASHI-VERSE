import Hls from 'hls.js'
import { withHlsProxy, needsProxy } from '../proxy'

export interface HlsPlayerOptions {
  referer?: string
  onError?: (err: { type: string; details: string; fatal: boolean }) => void
  onLevelLoaded?: (level: { level: number; details: unknown }) => void
}

export type PlaybackMode = 'native' | 'hlsjs' | 'direct'

/**
 * Indica si el navegador puede reproducir HLS de forma nativa
 * (Android, Android TV, iOS Safari, Edge). El elemento <video>
 * carga el recurso en modo no-cors: reproduce m3u8 de CDNs que
 * bloquean CORS sin problema.
 */
export function supportsNativeHls(): boolean {
  if (typeof document === 'undefined') return false
  const video = document.createElement('video')
  return Boolean(video.canPlayType('application/vnd.apple.mpegurl').replace(/no/, ''))
}

/**
 * Wrapper de reproducción con fallback en cascada:
 * 1. HLS nativo cuando está disponible (sin CORS, ideal móvil/TV).
 * 2. hls.js solo en navegadores sin HLS nativo (desktop Chrome/Firefox).
 * 3. Reproducción directa para MP4/otros.
 */
export class AkashiHlsPlayer {
  private hls: Hls | null = null
  private video: HTMLVideoElement
  mode: PlaybackMode = 'direct'

  constructor(video: HTMLVideoElement) {
    this.video = video
  }

  load(src: string, opts: HlsPlayerOptions = {}) {
    this.destroy()

    if (!src) return

    // Detecta HLS por extensión (.m3u8) o por ruta (/m3u8/<id> de zilla, etc.)
    const isHls = /m3u8/i.test(src)

    if (!isHls) {
      this.mode = 'direct'
      // MP4 directos de CDNs sin CORS pasan por el proxy (/hlsproxy)
      this.video.src = needsProxy(src) ? withHlsProxy(src, opts.referer) : src
      this.video.play().catch(() => {})
      return
    }

    if (Hls.isSupported()) {
      this.mode = 'hlsjs'
      // En desktop sin HLS nativo, los CDN bloquean CORS: se usa el proxy /hlsproxy
      const srcForLoader = withHlsProxy(src, opts.referer)
      const hls = new Hls({
        enableWorker: true,
        startLevel: -1,
        capLevelToPlayerSize: true,
        backBufferLength: 60,
      })

      let networkErrorCount = 0
      hls.on(Hls.Events.ERROR, (_e, data) => {
        const isFragError = data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR || data.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT
        if (isFragError) {
          networkErrorCount++
          if (networkErrorCount > 3) {
            hls.destroy()
            opts.onError?.({ type: 'fatal', details: 'Demasiados errores de fragmento consecutivos', fatal: true })
            return
          }
        }

        if (!data.fatal) {
          opts.onError?.({ type: 'error', details: String(data.details), fatal: false })
          return
        }
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // Para errores de manifiesto fatales
            hls.destroy()
            opts.onError?.({ type: 'fatal', details: String(data.details), fatal: true })
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError()
            break
          default:
            hls.destroy()
            opts.onError?.({ type: 'fatal', details: String(data.details), fatal: true })
            break
        }
      })

      hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
        opts.onLevelLoaded?.({ level: data.level, details: data.details })
      })

      hls.loadSource(srcForLoader)
      hls.attachMedia(this.video)
      this.hls = hls
    } else if (supportsNativeHls()) {
      this.mode = 'native'
      this.video.src = src
    } else {
      // Sin HLS nativo ni hls.js: último intento directo (con proxy si hace falta)
      this.mode = 'direct'
      this.video.src = needsProxy(src) ? withHlsProxy(src, opts.referer) : src
      this.video.play().catch(() => {})
    }
  }

  get hlsInstance(): Hls | null {
    return this.hls
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy()
      this.hls = null
    }
    this.video.removeAttribute('src')
    this.video.load()
  }
}
