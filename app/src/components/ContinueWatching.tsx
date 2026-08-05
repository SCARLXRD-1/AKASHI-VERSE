import { useRef } from 'react'
import { useHistory } from '../hooks/useHistory'
import { useSpatialNav } from '../hooks/useSpatialNav'
import { imageProxy } from '../lib/api'
import type { HistoryEntry } from '../types'

function pct(progress: number, duration: number): number {
  if (!duration || duration <= 0) return 0
  return Math.min(100, Math.round((progress / duration) * 100))
}

export default function ContinueWatching() {
  const { continueWatching } = useHistory()
  const ref = useRef<HTMLDivElement>(null)
  useSpatialNav(ref)

  if (continueWatching.length === 0) return null

  const resume = (entry: HistoryEntry) => {
    if (entry.watchUrl) window.location.assign(`/ver${entry.watchUrl}`)
  }

  return (
    <section ref={ref} className="section rise">
      <div className="section-head">
        <h2 className="section-title">Continuar viendo</h2>
      </div>
      <div className="grid">
        {continueWatching.slice(0, 8).map((entry) => {
          const done = pct(entry.progress, entry.duration)
          return (
            <div
              key={entry.id}
              className="card"
              data-nav
              tabIndex={0}
              onClick={() => resume(entry)}
            >
              <div className="card-poster">
                {entry.poster ? (
                  <img
                    src={entry.kind === 'anime' ? imageProxy(entry.poster) : entry.poster}
                    alt={entry.title}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div className="fallback" style={{ color: 'var(--accent)' }}>{entry.title.charAt(0).toUpperCase()}</div>
                )}
                <span className="badge">{entry.kind === 'anime' ? 'Anime' : entry.kind === 'series' ? 'Serie' : 'Película'}</span>
                <div className="history-progress">
                  <div style={{ width: `${done}%` }} />
                </div>
              </div>
              <div className="card-info">
                <div className="card-title">{entry.title}</div>
                <div className="card-sub">
                  {entry.episode ? `${entry.episode} · ` : ''}
                  {done}% · Reanudar ▶
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
