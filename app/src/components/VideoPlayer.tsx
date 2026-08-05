import AkashiHlsPlayer from './AkashiHlsPlayer'
import { isRealStream, withHlsProxy } from '../lib/proxy'

interface VideoPlayerProps {
  src: string
  poster?: string
  autoplay?: boolean
  embedUrl?: string
  referer?: string
  onProgress?: (current: number, total: number) => void
  onEnded?: () => void
  onFatal?: () => void
  startAt?: number
  watchId?: string
  children?: React.ReactNode
}

export default function VideoPlayer({
  src,
  poster,
  autoplay = true,
  referer,
  onProgress,
  onEnded,
  onFatal,
  startAt,
  watchId,
  children,
}: VideoPlayerProps) {
  if (!src) {
    return (
      <div className="player-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', height: '100%', minHeight: '400px', color: 'white' }}>
        <p>No hay fuente de video disponible.</p>
      </div>
    )
  }

  // Si src es un .m3u8 o .mp4 nativo, usamos nuestro reproductor avanzado sin publicidad.
  if (isRealStream(src)) {
    const proxySrc = withHlsProxy(src, referer)
    return (
      <div className="player-wrap native-mode" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', backgroundColor: '#000' }}>
        <AkashiHlsPlayer
          src={proxySrc}
          referer={referer}
          poster={poster}
          autoPlay={autoplay}
          onProgress={onProgress}
          onEnded={onEnded}
          onFatal={onFatal}
          startAt={startAt}
          watchId={watchId}
        >
          {children}
        </AkashiHlsPlayer>
      </div>
    )
  }

  // Fallback si por alguna razón nos llega un iframe (ya no debería ocurrir con el nuevo resolveStream, pero por seguridad)
  return (
    <div className="player-wrap iframe-mode" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', backgroundColor: '#000' }}>
      <iframe
        src={src}
        style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Server Playback"
        referrerPolicy="no-referrer"
      />
      {children && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          {children}
        </div>
      )}
    </div>
  )
}
