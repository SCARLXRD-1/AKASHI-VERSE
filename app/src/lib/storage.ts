import type { HistoryEntry } from '../types'

const HISTORY_KEY = 'akashiverse:history'
const MAX_HISTORY = 500
const PURGE_DAYS = 90

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch {
    // quota exceeded: intenta guardar sin posters
    try {
      const slim = entries.map((e) => ({ ...e, poster: undefined }))
      localStorage.setItem(HISTORY_KEY, JSON.stringify(slim))
    } catch {
      /* no-op */
    }
  }
}

export function getHistory(): HistoryEntry[] {
  return read()
}

export function upsertHistory(entry: HistoryEntry): HistoryEntry[] {
  const entries = read().filter((e) => e.id !== entry.id)
  entries.unshift(entry)
  const trimmed = entries.slice(0, MAX_HISTORY)
  write(trimmed)
  return trimmed
}

export function deleteHistoryEntry(id: string): HistoryEntry[] {
  const entries = read().filter((e) => e.id !== id)
  write(entries)
  return entries
}

export function clearHistory(): HistoryEntry[] {
  write([])
  return []
}

export function getContinueWatching(): HistoryEntry[] {
  const all = read().filter((e) => e.progress > 0 && e.progress < e.duration - 5)
  // Deduplicate by title so we only see the latest episode of a series
  const seen = new Set<string>()
  return all.filter((entry) => {
    if (seen.has(entry.title)) return false
    seen.add(entry.title)
    return true
  })
}

export function purgeOldHistory(): void {
  const cutoff = Date.now() - PURGE_DAYS * 24 * 60 * 60 * 1000
  const entries = read().filter((e) => e.timestamp > cutoff)
  write(entries)
}
