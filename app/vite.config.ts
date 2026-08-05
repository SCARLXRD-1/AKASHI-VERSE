import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function absoluteOf(base: string, ref: string): string {
  try {
    return new URL(base, ref).toString()
  } catch {
    return base
  }
}

function wrapLine(line: string, target: string, referer?: string): string {
  if (line.startsWith('#')) {
    // Reescribe URI="..." dentro de EXT-X-KEY / EXT-X-MAP
    if (line.includes('URI="')) {
      return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
        const abs = absoluteOf(uri, target)
        const qs = new URLSearchParams({ url: abs })
        if (referer) qs.set('ref', referer)
        return `URI="/hlsproxy?${qs.toString()}"`
      })
    }
    return line
  }
  if (!line.trim()) return line
  const abs = absoluteOf(line, target)
  const qs = new URLSearchParams({ url: abs })
  if (referer) qs.set('ref', referer)
  return `/hlsproxy?${qs.toString()}`
}

/**
 * Middleware de desarrollo: /hlsproxy?url=...&ref=...
 * Descarga manifests HLS y segmentos sin CORS, reescribe las URLs
 * de segmentos hacia el propio proxy y responde con CORS.
 */
function hlsProxyPlugin(): Plugin {
  return {
    name: 'hls-cors-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/hlsproxy')) return next()
        const parsed = new URL(req.url, 'http://localhost')
        const target = parsed.searchParams.get('url')
        const referer = parsed.searchParams.get('ref') || undefined
        if (!target) {
          res.statusCode = 400
          res.end('missing url')
          return
        }
        try {
          const targetUrl = new URL(target)
          const headers: Record<string, string> = { 'User-Agent': CHROME_UA }
          
          let resolvedReferer = referer
          let resolvedOrigin: string | undefined

          if (resolvedReferer) {
            try {
              const refUrl = new URL(resolvedReferer)
              if (refUrl.hostname !== targetUrl.hostname) {
                const isStreamCdn = /wish|awish|playnix|medix|niramirus|kravaxxa|davioad|haxlopp|tryzendm|dumbalag|dhcplay|hglink|voe|mixdrop|dood|dropload|vidhide|streamtape|hgplaycdn|hglamioz|zilla-networks|filemoon/i.test(targetUrl.hostname)
                if (isStreamCdn) {
                  resolvedReferer = targetUrl.origin + '/'
                }
              }
            } catch {
              resolvedReferer = targetUrl.origin + '/'
            }
          } else {
            resolvedReferer = targetUrl.origin + '/'
          }

          // Zilla Networks usa Cloudflare con validación estricta de Origin + Referer.
          // Necesitan que el Referer apunte a la página del reproductor (/play/<id>),
          // no solo al dominio raíz, y que el Origin coincida exactamente.
          if (/zilla-networks/i.test(targetUrl.hostname)) {
            // Extraer el hash del segmento para reconstruir la URL del player
            const segHash = targetUrl.pathname.split('/').filter(Boolean)[1] // /segs/<hash>/...
            if (segHash) {
              resolvedReferer = `${targetUrl.origin}/play/${segHash}`
            }
            resolvedOrigin = targetUrl.origin
          }

          if (resolvedReferer) {
            headers['Referer'] = resolvedReferer
          }
          if (resolvedOrigin) {
            headers['Origin'] = resolvedOrigin
          }

          // Reenviar Range para que el seek funcione en MP4 directos
          const range = req.headers.range
          if (range) headers['Range'] = range
          const upstream = await fetch(target, { headers })
          if (!upstream.ok || !upstream.body) {
            res.statusCode = upstream.status || 502
            res.end()
            return
          }
          const contentType = upstream.headers.get('content-type') || ''
          const isManifest = /mpegurl|vnd\.apple/i.test(contentType) || /\.m3u8/i.test(target)
          if (isManifest) {
            const text = await upstream.text()
            const rewritten = text
              .split('\n')
              .map((l) => wrapLine(l, target, referer))
              .join('\n')
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Cache-Control', 'no-store')
            res.end(rewritten)
            return
          }
          // Segmentos binarios: stream directo con CORS
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Accept-Ranges', 'bytes')
          // Reenviar status 206 (Partial Content) para Range requests
          if (upstream.status === 206) res.statusCode = 206
          for (const [key, value] of upstream.headers) {
            if (/^content-(type|length|range)$/i.test(key)) {
              if (key.toLowerCase() === 'content-type') {
                const isVideoMime = /^video\//i.test(value)
                if (!isVideoMime) {
                  if (/\.(mp4|m4s|m4v)(?:\?|$)/i.test(targetUrl.pathname)) {
                    res.setHeader(key, 'video/mp4')
                  } else {
                    res.setHeader(key, 'video/mp2t')
                  }
                } else {
                  res.setHeader(key, value)
                }
              } else {
                res.setHeader(key, value)
              }
            }
          }
          const reader = upstream.body.getReader()
          const pump = async (): Promise<void> => {
            try {
              const { done, value } = await reader.read()
              if (done) {
                res.end()
                return
              }
              res.write(Buffer.from(value))
              void pump()
            } catch (err) {
              res.end()
            }
          }
          void pump()
        } catch (err) {
          res.statusCode = 502
          res.end(String(err))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    hlsProxyPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png'],
      manifest: {
        name: 'AkashiVerse',
        short_name: 'AkashiVerse',
        description: 'Películas, series y anime en un solo lugar. Instalable en móvil y TV.',
        theme_color: '#0f0f1a',
        background_color: '#0f0f1a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        lang: 'es',
        categories: ['entertainment', 'video'],
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'akashiverse-api',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\.(jpg|jpeg|png|webp|avif)(\?.*)?$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'akashiverse-images',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
})
