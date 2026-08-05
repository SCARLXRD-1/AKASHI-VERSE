import { useMemo, useRef, useState } from 'react'
import { useHistory } from '../hooks/useHistory'
import { useSpatialNav } from '../hooks/useSpatialNav'
import { imageProxy } from '../lib/api'
import type { MediaKind } from '../types'

const KIND_LABEL: Record<MediaKind, string> = { movie: 'Película', series: 'Serie', anime: 'Anime' }

function pct(progress: number, duration: number): number {
  if (!duration || duration <= 0) return 0
  return Math.min(100, Math.round((progress / duration) * 100))
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'ahora mismo'
  const m = Math.floor(s / 60)
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d} d`
  return new Date(ts).toLocaleDateString()
}

export default function History() {
  const { entries, clear, remove } = useHistory()
  const ref = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<'all' | MediaKind>('all')

  useSpatialNav(ref)

  const filtered = useMemo(
    () => (filter === 'all' ? entries : entries.filter((e) => e.kind === filter)),
    [entries, filter],
  )

  const resume = (watchUrl: string) => {
    window.location.assign(`/ver${watchUrl}`)
  }

  return (
    <div ref={ref}>
      <section className="hero">
        <div>
          <span className="kicker">Tu actividad</span>
          <h1>
            <em>Historial</em>
          </h1>
          {entries.length > 0 && (
            <button className="btn btn-ghost" data-nav style={{ marginTop: 16 }} onClick={clear}>
              🗑 Borrar historial
            </button>
          )}
        </div>
      </section>

      <div className="season-tabs">
        {(['all', 'movie', 'series', 'anime'] as const).map((k) => (
          <button
            key={k}
            className={`season-tab ${filter === k ? 'active' : ''}`}
            data-nav
            onClick={() => setFilter(k)}
          >
            {k === 'all' ? 'Todo' : KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty">
          <h3>Sin historial</h3>
          <p>Cuando reproduzcas contenido aparecerá aquí tu actividad.</p>
        </div>
      )}

      <div className="grid" style={{ marginTop: 20 }}>
        {filtered.map((entry) => (
          <div key={entry.id} className="card" data-nav tabIndex={0} onClick={() => entry.watchUrl && resume(entry.watchUrl)}>
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
              <span className="badge">{KIND_LABEL[entry.kind]}</span>
              <div className="history-progress">
                <div style={{ width: `${pct(entry.progress, entry.duration)}%` }} />
              </div>
            </div>
            <div className="card-info">
              <div className="card-title">{entry.title}</div>
              <div className="card-sub">
                {entry.episode ? `${entry.episode} · ` : ''}
                {timeAgo(entry.timestamp)}
              </div>
              <button
                className="history-remove"
                aria-label="Eliminar del historial"
                data-nav
                onClick={(e) => { e.stopPropagation(); remove(entry.id) }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
