/**
 * Proxy HLS para navegadores sin HLS nativo (Chrome desktop).
 * El CDN no envía Access-Control-Allow-Origin; el proxy de Vite
 * (/hlsproxy) descarga el manifest y segmentos server-side y los
 * re-sirve con CORS + headers de referer.
 */
const CORS_FRIENDLY_HOSTS: RegExp[] = []

/** Dominios que ya envían Access-Control-Allow-Origin: se reproducen directos. */
export function needsProxy(url: string): boolean {
  try {
    const host = new URL(url).hostname
    if (CORS_FRIENDLY_HOSTS.some((re) => re.test(host))) return false
  } catch {
    /* URL inválida: se proxya igual para evitar errores de CORS */
  }
  return true
}

export function withHlsProxy(url: string, referer?: string): string {
  if (!needsProxy(url)) return url
  const origin = window.location.origin
  const qs = new URLSearchParams({ url })
  if (referer) qs.set('ref', referer)
  return `${origin}/hlsproxy?${qs.toString()}`
}

/** Valida que una URL parezca un stream de video real (no un embed/html). */
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  } catch {
    return false
  }
  if (/\.(m3u8|mp4|webm|mpd)(\?.*)?$/i.test(url)) return true
  if (/\.(html|css|js)(\?.*)?$/i.test(url)) return false
  if (/(\/m3u8\/|\/(hls|stream|videos?)\/|\.m3u8|\.mp4)/i.test(url)) return true
  return false
}

/**
 * Ignora resoluciones que devuelven el propio embed (resolver roto).
 * Muchos CDNs entregan streams con URLs firmadas que no contienen una
 * extensión (.m3u8/.mp4), por lo que no se deben descartar por su ruta.
 * Si la URL resuelta parece un video directo (mp4, m3u8, etc.), se acepta
 * aunque sea igual al embed (caso de URLs directas de archive.org, etc.).
 */
export function isRealStream(resolvedUrl?: string | null, embedUrl?: string | null): boolean {
  if (!resolvedUrl) return false
  try {
    const resolved = new URL(resolvedUrl)
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return false
    if (isVideoUrl(resolvedUrl)) return true
    if (!embedUrl) return true
    return resolved.toString() !== new URL(embedUrl).toString()
  } catch {
    return false
  }
}
