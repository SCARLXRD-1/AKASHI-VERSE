import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, FastForward, Rewind, Loader2 } from 'lucide-react'
import './AkashiHlsPlayer.css'

interface AkashiHlsPlayerProps {
  src: string
  poster?: string
  autoPlay?: boolean
  referer?: string
  startAt?: number
  watchId?: string
  onProgress?: (current: number, duration: number) => void
  onEnded?: () => void
  onFatal?: () => void
  children?: React.ReactNode
}

function formatTime(timeInSeconds: number) {
  if (Number.isNaN(timeInSeconds) || !timeInSeconds) return "00:00"
  const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0')
  const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function AkashiHlsPlayer({
  src,
  poster,
  autoPlay = true,
  startAt = 0,
  onProgress,
  onEnded,
  onFatal,
  children
}: AkashiHlsPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isWaiting, setIsWaiting] = useState(true)
  
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let hls = hlsRef.current
    setIsWaiting(true)

    const isNativeVideo = /\.(mp4|webm|ogg|mkv)(\?.*)?$/i.test(src)

    if (Hls.isSupported() && !isNativeVideo) {
      if (hls) {
        hls.destroy()
      }
      hls = new Hls({
        startPosition: startAt > 0 ? startAt : -1,
        enableWorker: true,
        manifestLoadingTimeOut: 20000,
        fragLoadingTimeOut: 20000,
        testBandwidth: false // Prevent unnecessary quality switches that cause glitches
      })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)

      let recoverAttempts = 0
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('[HLS] Fatal error:', data)
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (recoverAttempts === 0) {
                console.warn('[HLS] Fatal Media Error, attempting recovery...')
                hls?.recoverMediaError()
              } else if (recoverAttempts === 1) {
                console.warn('[HLS] Fatal Media Error again, swapping audio codec...')
                hls?.swapAudioCodec()
                hls?.recoverMediaError()
              } else {
                console.error('[HLS] Could not recover media error, triggering fallback.')
                if (onFatal) onFatal()
              }
              recoverAttempts++
              break
            default:
              if (onFatal) onFatal()
              break
          }
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || isNativeVideo) {
      video.src = src
      if (startAt > 0) {
        video.currentTime = startAt
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src])

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false)
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const current = videoRef.current.currentTime
    const dur = videoRef.current.duration
    setCurrentTime(current)
    setProgress((current / dur) * 100 || 0)
    
    if (onProgress) onProgress(current, dur)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const seekTo = (Number(e.target.value) / 100) * videoRef.current.duration
    videoRef.current.currentTime = seekTo
    setProgress(Number(e.target.value))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const vol = Number.parseFloat(e.target.value)
    videoRef.current.volume = vol
    setVolume(vol)
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const newMuted = !isMuted
    videoRef.current.muted = newMuted
    setIsMuted(newMuted)
    if (newMuted) setVolume(0)
    else {
      videoRef.current.volume = 1
      setVolume(1)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    } else {
      containerRef.current.requestFullscreen().catch(err => console.log(err))
      setIsFullscreen(true)
    }
  }

  const skipTime = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount
    }
  }

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement?.tagName
      if (active === 'INPUT' || active === 'TEXTAREA') return
      
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'KeyF') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.code === 'KeyM') {
        e.preventDefault()
        toggleMute()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        skipTime(10)
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        skipTime(-10)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMuted, isFullscreen])

  // Fix fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div 
      ref={containerRef}
      className="akashi-player-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerDown={() => { if(!showControls) setShowControls(true) }}
    >
      <video
        ref={videoRef}
        className="akashi-player-video"
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
          setIsWaiting(false)
        }}
        onWaiting={() => setIsWaiting(true)}
        onPlaying={() => setIsWaiting(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          if (onEnded) onEnded()
        }}
      />

      {isWaiting && (
        <div className="akashi-player-spinner">
          <Loader2 size={48} />
        </div>
      )}

      {/* Controles Overlay */}
      <div className={`akashi-player-overlay ${showControls || !isPlaying ? '' : 'hidden'}`}>
        <div className="akashi-progress-container">
          <span className="akashi-time">{formatTime(currentTime)}</span>
          <input 
            type="range" 
            min="0" max="100" 
            value={progress || 0}
            onChange={handleSeek}
            className="akashi-progress-bar"
            style={{
              background: `linear-gradient(to right, var(--accent, #b14aed) ${progress}%, rgba(255,255,255,0.2) ${progress}%)`
            }}
          />
          <span className="akashi-time">{formatTime(duration)}</span>
        </div>

        <div className="akashi-controls-row" style={{ justifyContent: 'space-between' }}>
          <div className="akashi-controls-row" style={{ gap: '20px' }}>
            <button className="akashi-control-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
            </button>
            <button className="akashi-control-btn" onClick={() => skipTime(-10)}>
              <Rewind size={22} />
            </button>
            <button className="akashi-control-btn" onClick={() => skipTime(10)}>
              <FastForward size={22} />
            </button>

            <div className="akashi-controls-row" style={{ gap: '8px', marginLeft: '10px' }}>
              <button className="akashi-control-btn" onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
              <input 
                type="range" 
                min="0" max="1" step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="akashi-volume-slider"
                style={{
                  background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`
                }}
              />
            </div>
          </div>

          <div className="akashi-controls-row">
            <button className="akashi-control-btn" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Elementos inyectados como la tarjeta de AutoPlay */}
      {children && (
        <div className="akashi-player-children">
          {children}
        </div>
      )}
    </div>
  )
}
