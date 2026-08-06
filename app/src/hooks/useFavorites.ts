import { useCallback, useEffect, useState } from 'react'
import type { HistoryEntry } from '../types'
import { getFavorites, toggleFavorite, isFavorite } from '../lib/storage'

export function useFavorites() {
  const [favorites, setFavorites] = useState<HistoryEntry[]>([])

  useEffect(() => {
    setFavorites(getFavorites())
  }, [])

  const refresh = useCallback(() => {
    setFavorites(getFavorites())
  }, [])

  const toggle = useCallback((entry: HistoryEntry) => {
    const isNowFavorite = toggleFavorite(entry)
    refresh()
    return isNowFavorite
  }, [refresh])

  const checkIsFavorite = useCallback((id: string) => {
    return isFavorite(id)
  }, [])

  return { favorites, toggle, checkIsFavorite, refresh }
}
