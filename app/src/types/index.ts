export type MediaKind = 'movie' | 'series' | 'anime'

export interface MediaItem {
  title: string
  image?: string
  poster?: string
  url?: string
  slug?: string
  type?: string
  year?: string
  rating?: string
  provider: string
  kind: MediaKind
  episodeUrl?: string
  episodeNumber?: number
}

export interface HistoryEntry {
  id: string
  kind: MediaKind
  title: string
  poster?: string
  provider: string
  episode?: string
  season?: number
  episodeNumber?: number
  progress: number
  duration: number
  timestamp: number
  watchUrl?: string
  nextUrl?: string
}

export interface Episode {
  number: number
  title?: string
  url?: string
  slug?: string
}

export interface Season {
  season: number
  episodes: Episode[]
}

export interface ContentInfo {
  title: string
  poster?: string
  synopsis?: string
  rating?: string
  year?: string
  genres?: string[]
  directors?: string[]
  actors?: string[]
  seasons?: Season[]
  provider?: string
}

export interface VideoServer {
  server?: string
  url?: string
  streamUrl?: string
  mediaType?: string
  iframe?: string
}

export interface ServerResponse {
  success?: boolean
  data?: VideoServer[]
  servers?: VideoServer[]
  links?: VideoServer[]
}
