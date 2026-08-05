import type { MediaItem, Season } from '../types'
import { animeApi, peliApi } from './api'

export interface RelatedEntry {
  title: string
  url: string
  image?: string
  type?: number | string
}

export interface SeasonInfo {
  count: number
  seasons: Season[]
  relations: RelatedEntry[]
}

export function normalizeSeasons(value: unknown): Season[] {
  if (!Array.isArray(value)) return []

  return value
    .map((rawSeason) => {
      const seasonData = rawSeason as Record<string, unknown>
      const season = Number(seasonData.season ?? seasonData.number)
      const rawEpisodes = Array.isArray(seasonData.episodes) ? seasonData.episodes : []
      const episodes = rawEpisodes
        .map((rawEpisode) => {
          if (typeof rawEpisode === 'number') return { number: rawEpisode }
          const episodeData = rawEpisode as Record<string, unknown>
          return {
            number: Number(episodeData.number ?? episodeData.episode),
            title: typeof episodeData.title === 'string' ? episodeData.title : undefined,
            url: typeof episodeData.url === 'string' ? episodeData.url : undefined,
          }
        })
        .filter((episode) => Number.isFinite(episode.number) && episode.number > 0)
        .filter((episode, index, self) => index === self.findIndex((e) => e.number === episode.number))
        .sort((a, b) => a.number - b.number)

      return { season, episodes }
    })
    .filter((season) => Number.isFinite(season.season) && season.season > 0)
    .sort((a, b) => a.season - b.season)
}

const cache = new Map<string, Promise<SeasonInfo | null>>()

function keyOf(item: MediaItem): string {
  return `${item.kind}:${item.url || item.slug || item.title}`
}

function normalizeRawSeasons(value: unknown): Season[] {
  if (!Array.isArray(value)) return []
  return value
    .map((raw) => {
      const s = raw as Record<string, unknown>
      const season = Number(s.number ?? s.season ?? 0)
      const rawEpisodes = Array.isArray(s.episodes) ? (s.episodes as Array<Record<string, unknown>>) : []
      const episodes = rawEpisodes
        .map((e) => ({
          number: Number(e.number ?? e.episode),
          title: typeof e.title === 'string' ? e.title : undefined,
          url: typeof e.url === 'string' ? e.url : undefined,
        }))
        .filter((e) => Number.isFinite(e.number) && e.number > 0)
        .filter((episode, index, self) => index === self.findIndex((e) => e.number === episode.number))
      return { season, episodes }
    })
    .filter((s) => Number.isFinite(s.season) && s.season > 0)
}

async function fetchSeasons(item: MediaItem): Promise<SeasonInfo | null> {
  try {
    if (item.kind === 'anime') {
      const url = item.url || item.slug
      if (!url) return null
      const payload = await animeApi.info(url)
      const data = (payload?.data ?? payload ?? {}) as Record<string, unknown>
      const rawRelations = Array.isArray(data.relations) ? (data.relations as Array<Record<string, unknown>>) : []
      const relations: RelatedEntry[] = rawRelations
        .map((r) => ({
          title: String(r.title || ''),
          url: String(r.url || ''),
          image: typeof r.image === 'string' ? r.image : undefined,
          type: typeof r.type === 'number' || typeof r.type === 'string' ? r.type : undefined,
        }))
        .filter((r) => r.title && r.url)
      return {
        count: relations.length + 1,
        seasons: [],
        relations,
      }
    }

    if (item.kind === 'series') {
      const slug = item.slug || item.url
      if (!slug) return null
      const raw = await peliApi.info(slug, 'serie')
      const seasons = normalizeRawSeasons(raw?.seasons)
      if (seasons.length === 0) return null
      return {
        count: seasons.length,
        seasons,
        relations: [],
      }
    }

    return null
  } catch {
    return null
  }
}

export function getSeasonsInfo(item: MediaItem): Promise<SeasonInfo | null> {
  const key = keyOf(item)
  const cached = cache.get(key)
  if (cached) return cached
  const promise = fetchSeasons(item)
  cache.set(key, promise)
  return promise
}

export function canHaveSeasons(item: MediaItem): boolean {
  return item.kind === 'series' || item.kind === 'anime'
}

export function seasonCountLabel(info: SeasonInfo | null): string | null {
  if (!info) return null
  const n = info.count
  if (n <= 1) return null
  if (info.relations.length > 0 && info.seasons.length === 0) return `${n} partes`
  return `${n} temporadas`
}
