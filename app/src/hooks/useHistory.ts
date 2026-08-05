import { useCallback, useEffect, useState } from 'react'
import type { HistoryEntry } from '../types'
import {
  clearHistory,
  deleteHistoryEntry,
  getContinueWatching,
  getHistory,
  purgeOldHistory,
  upsertHistory,
} from '../lib/storage'

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [continueWatching, setContinueWatching] = useState<HistoryEntry[]>([])

  useEffect(() => {
    purgeOldHistory()
    setEntries(getHistory())
    setContinueWatching(getContinueWatching())
  }, [])

  const refresh = useCallback(() => {
    setEntries(getHistory())
    setContinueWatching(getContinueWatching())
  }, [])

  const save = useCallback((entry: HistoryEntry) => {
    upsertHistory(entry)
    refresh()
  }, [refresh])

  const remove = useCallback((id: string) => {
    deleteHistoryEntry(id)
    refresh()
  }, [refresh])

  const clear = useCallback(() => {
    clearHistory()
    refresh()
  }, [refresh])

  return { entries, continueWatching, save, remove, clear, refresh }
}
