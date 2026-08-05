import { config } from './config'
import type { MediaItem } from '../types'

export type { MediaItem }

const JSON_HEADERS: HeadersInit = { Accept: 'application/json' }

async function getJson(url: string, headers: HeadersInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...JSON_HEADERS, ...headers } })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    throw new Error(`Respuesta no JSON desde ${url}`)
  }
}

function cleanTitle(title: string): string {
  return title
    .replace(/^VER\s+/i, '')
    .replace(/\s*(Online\s+Gratis\s+HD|online\s+hd|HD)\s*$/i, '')
    .trim()
}

function normalizePeliItem(item: Record<string, unknown>): MediaItem | null {
  const title = cleanTitle(String(item.title || item.name || ''))
  if (!title) return null
  const type = String(item.type || '')
  const kind: MediaItem['kind'] = type === 'serie' || type === 'series' ? 'series' : 'movie'
  return {
    title,
    image: (item.image as string) || (item.poster as string) || undefined,
    poster: (item.poster as string) || (item.image as string) || undefined,
    url: (item.url as string) || undefined,
    slug: (item.slug as string) || (item.url as string) || undefined,
    type: type || undefined,
    year: item.year ? String(item.year) : undefined,
    rating: item.rating ? String(item.rating) : undefined,
    provider: String(item.provider || 'pelisplus'),
    kind,
  }
}

function normalizeAnimeItem(item: Record<string, unknown>): MediaItem | null {
  const title = String(item.title || item.name || '')
  if (!title) return null
  return {
    title,
    image: (item.image as string) || (item.poster as string) || undefined,
    poster: (item.image as string) || (item.poster as string) || undefined,
    url: (item.url as string) || undefined,
    slug: (item.slug as string) || (item.url as string) || undefined,
    type: item.type ? String(item.type) : undefined,
    provider: String(item.provider || 'jkanime'),
    kind: 'anime',
    year: item.year ? String(item.year) : undefined,
    rating: item.rating ? String(item.rating) : undefined,
  }
}

function extractList(payload: unknown): Array<Record<string, unknown>> {
  const candidates = (value: unknown): Array<Record<string, unknown>> => {
    if (Array.isArray(value)) return value as Array<Record<string, unknown>>
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>
      for (const key of ['items', 'results', 'data', 'list']) {
        const nested = obj[key]
        if (Array.isArray(nested)) return nested as Array<Record<string, unknown>>
        if (nested && typeof nested === 'object') {
          const found = candidates(nested)
          if (found.length > 0 || Array.isArray(nested)) return found
        }
      }
    }
    return []
  }
  return candidates(payload)
}

export const peliApi = {
  search: async (q: string): Promise<MediaItem[]> => {
    const payload = await getJson(`${config.peliApiUrl}/api/v1/content/search?q=${encodeURIComponent(q)}`)
    return extractList(payload)
      .map(normalizePeliItem)
      .filter((x): x is MediaItem => Boolean(x))
  },
  catalog: async (params: { type?: string; genre?: string; page?: number } = {}): Promise<MediaItem[]> => {
    const qs = new URLSearchParams()
    if (params.type) qs.set('type', params.type)
    if (params.genre) qs.set('genre', params.genre)
    if (params.page) qs.set('page', String(params.page))
    const payload = await getJson(`${config.peliApiUrl}/api/v1/content/catalog?${qs.toString()}`)
    return extractList(payload)
      .map(normalizePeliItem)
      .filter((x): x is MediaItem => Boolean(x))
  },
  genres: async (): Promise<Array<{ name: string; slug: string }>> => {
    const payload = (await getJson(`${config.peliApiUrl}/api/v1/content/genres`)) as Record<string, unknown>
    const data = payload?.data
    return Array.isArray(data)
      ? data.filter((genre): genre is { name: string; slug: string } =>
          Boolean(genre && typeof genre === 'object' && (genre as { name?: unknown }).name && (genre as { slug?: unknown }).slug),
        )
      : []
  },
  info: async (slug: string, type: string): Promise<Record<string, unknown>> => {
    const payload = (await getJson(
      `${config.peliApiUrl}/api/v1/content/info/${encodeURIComponent(slug)}?type=${encodeURIComponent(type)}`,
    )) as Record<string, unknown>
    return (payload?.data ?? {}) as Record<string, unknown>
  },
  servers: async (
    slug: string,
    season: number,
    episode: number,
    title = '',
    url?: string,
    tmdbId?: string | number,
  ): Promise<Record<string, unknown>> => {
    const qs = new URLSearchParams({ slug, season: String(season), episode: String(episode) })
    if (title) qs.set('title', title)
    if (url) qs.set('url', url)
    if (tmdbId) qs.set('tmdbId', String(tmdbId))
    const payload = await getJson(`${config.peliApiUrl}/api/v1/content/servers?${qs.toString()}`)
    return (payload?.data ?? payload ?? {}) as Record<string, unknown>
  },
  resolve: async (url: string, parentUrl?: string): Promise<string | undefined> => {
    const qs = new URLSearchParams({ url })
    if (parentUrl) qs.set('parentUrl', parentUrl)
    const payload = (await getJson(`${config.peliApiUrl}/api/v1/content/resolve?${qs.toString()}`)) as Record<string, unknown>
    const data = (payload?.data ?? {}) as Record<string, unknown>
    return (data?.directUrl as string) || undefined
  },
  preflight: async (payload: Record<string, unknown>): Promise<{ servers?: Array<{ name?: string; language?: string; quality?: string; embedUrl?: string; directUrl?: string; latencyMs?: number }>; checked?: number; working?: number } | undefined> => {
    try {
      console.log('[API] preflight POST →', `${config.peliApiUrl}/api/v1/content/preflight`)
      const res = await fetch(`${config.peliApiUrl}/api/v1/content/preflight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      console.log('[API] preflight response:', res.status)
      if (!res.ok) {
        console.error('[API] preflight error:', res.status, await res.text().catch(() => ''))
        return undefined
      }
      const json = (await res.json()) as Record<string, unknown>
      const data = (json?.data ?? {}) as Record<string, unknown>
      console.log('[API] preflight data:', data.working, 'working of', data.checked)
      return data
    } catch (err) {
      console.error('[API] preflight fetch error:', err)
      return undefined
    }
  },
}

export const animeApi = {
  // El backend no expone un endpoint separado de "episodios recientes".
  // Usamos la primera página del catálogo como contenido reciente/destacado.
  recentEpisodes: async (): Promise<MediaItem[]> => {
    return animeApi.catalog(1)
  },
  search: async (q: string): Promise<MediaItem[]> => {
    const payload = await getJson(
      `${config.animeApiUrl}/api/v1/anime/search?q=${encodeURIComponent(q)}`,
      { 'X-API-Key': config.animeApiKey },
    )
    return extractList(payload)
      .map(normalizeAnimeItem)
      .filter((x): x is MediaItem => Boolean(x))
  },
  catalog: async (page = 1, genre?: string, provider?: string): Promise<MediaItem[]> => {
    const qs = new URLSearchParams({ page: String(page) })
    if (genre) qs.set('type', genre) // map genre to type
    if (provider) qs.set('provider', provider)
    const payload = await getJson(
      `${config.animeApiUrl}/api/v1/anime/catalog?${qs.toString()}`,
      { 'X-API-Key': config.animeApiKey },
    )
    return extractList(payload)
      .map(normalizeAnimeItem)
      .filter((x): x is MediaItem => Boolean(x))
  },
  info: async (url: string): Promise<Record<string, unknown>> => {
    return (await getJson(
      `${config.animeApiUrl}/api/v1/anime/info?url=${encodeURIComponent(url)}`,
      { 'X-API-Key': config.animeApiKey },
    )) as Record<string, unknown>
  },
  episodeLinks: async (url: string): Promise<Record<string, unknown>> => {
    return (await getJson(
      `${config.animeApiUrl}/api/v1/anime/episode?url=${encodeURIComponent(url)}`,
      { 'X-API-Key': config.animeApiKey },
    )) as Record<string, unknown>
  },

  resolve: async (url: string): Promise<{ streamUrl?: string; mediaType?: string; server?: string }> => {
    return (await getJson(
      `${config.animeApiUrl}/api/v1/anime/resolve?url=${encodeURIComponent(url)}`,
      { 'X-API-Key': config.animeApiKey },
    )) as { streamUrl?: string; mediaType?: string; server?: string }
  },
  resolveMany: async (urls: string[]): Promise<{ streamUrl?: string; mediaType?: string; server?: string; resolvedFrom?: string }> => {
    if (urls.length === 0) return {}
    return (await getJson(
      `${config.animeApiUrl}/api/v1/anime/resolve?urls=${encodeURIComponent(JSON.stringify(urls))}`,
      { 'X-API-Key': config.animeApiKey },
    )) as { streamUrl?: string; mediaType?: string; server?: string; resolvedFrom?: string }
  },
  hybridDubServers: async (title: string, episodeNumber: number): Promise<any[]> => {
    try {
      const searchRes = await animeApi.search(title)
      const av1Match = searchRes.find(a => a.provider === 'AnimeAV1')
      if (!av1Match || !av1Match.url) return []
      
      const info = await animeApi.info(av1Match.url)
      const ep = ((info.data as any)?.episodes || info.episodes as any[])?.find((e: any) => Number(e.number) === Number(episodeNumber))
      if (!ep || !ep.url) return []
      
      const payload = await animeApi.episodeLinks(ep.url)
      const data = (payload?.data ?? payload ?? {}) as Record<string, any>
      const dubLinks = Array.isArray(data?.streamLinks?.DUB) ? data.streamLinks.DUB : 
                      Array.isArray(data?.servers?.dub) ? data.servers.dub : []
      return dubLinks
    } catch (e) {
      console.warn('[HYBRID] Error fetching AnimeAV1 dub servers:', e)
      return []
    }
  },
}

export const imageProxy = (url: string): string =>
  `${config.animeApiUrl}/api/v1/anime/image-proxy?url=${encodeURIComponent(url)}`
