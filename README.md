# AkashiVerse

App web instalable (PWA) para ver y descargar películas, series y anime. Motorizado por dos APIs open source de [FxxMorgan](https://github.com/FxxMorgan/):

| Proyecto | Contenido | Puerto | Repo |
|----------|-----------|--------|------|
| **PeliApi** | Películas y series | `5555` | [FxxMorgan/peliapi](https://github.com/FxxMorgan/peliapi) |
| **Anime1v API** | Anime | `3001` | [FxxMorgan/anime1v-api](https://github.com/FxxMorgan/anime1v-api) |

---

## Requisitos del sistema (dependencias base)

Estos se instalan a nivel de sistema operativo. Son compartidos por ambas APIs:

| Dependencia | Necesaria | Uso |
|-------------|-----------|-----|
| [Node.js](https://nodejs.org/) 18 o superior | **Sí** | Runtime de ambas APIs |
| `ffmpeg` (a nivel sistema) | **Sí** | Consolidación de fragmentos HLS `.ts` → `.mp4` |
| `yt-dlp` (a nivel sistema, en PATH) | Recomendado | Resolvedor fallback de streams |

Instalación en Linux (Debian/Ubuntu):

```bash
sudo apt update
sudo apt install -y nodejs ffmpeg
# yt-dlp (última versión):
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

Verificar:

```bash
node -v
ffmpeg -version
yt-dlp --version
```

---

## Dependencias npm (dentro de cada proyecto)

Instaladas en el repo de cada API con `npm install`:

| Paquete | Dónde | Notas |
|---------|-------|-------|
| `puppeteer` | Ambas | Se instala **aparte** (`npm install puppeteer`); necesario para sitios con protección JS (anti-bot, Cloudflare). Descarga Chromium (~170MB). |
| `fluent-ffmpeg` + `ffmpeg-static` | Anime1v | Ya incluidos en el repo |
| Dependencias base | Ambas | Ya declaradas en cada `package.json` |

---

## Setup de cada API

### 1. PeliApi (películas/series)

```bash
git clone https://github.com/FxxMorgan/peliapi.git
cd peliapi
npm install
npm install puppeteer
cp .env.example .env
npm run dev   # http://localhost:5555
```

Variables `.env` principales:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `5555` | Puerto del servidor |
| `DOWNLOADS_DIR` | `downloads` | Carpeta temporal de descargas |
| `MAX_CONCURRENT_PAGES` | `2` | Máximo de páginas Puppeteer simultáneas |
| `YTDLP_ENABLED` | `true` | Habilitar yt-dlp como fallback |
| `YTDLP_TIMEOUT_MS` | `8500` | Timeout yt-dlp |

CLI de descargas: `node descargador.js`

### 2. Anime1v API (anime)

```bash
git clone https://github.com/FxxMorgan/anime1v-api.git
cd anime1v-api
npm install
npm install puppeteer
cp .env.example .env
npm run dev   # http://localhost:3001
```

Variables `.env` principales:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DOWNLOADS_DIR` | `downloads` | Carpeta de descargas |
| `REQUEST_TIMEOUT_MS` | `15000` | Timeout requests HTTP |
| `DOWNLOAD_REQUEST_TIMEOUT_MS` | `120000` | Timeout descarga |
| `DEFAULT_ANIME_DOMAIN` | `animeav1.com` | Dominio AnimeAV1 |
| `MAX_CONCURRENT_PAGES` | `2` | Máximo de páginas Puppeteer |
| `YTDLP_ENABLED` | `true` | Habilitar yt-dlp como fallback |

CLI de descargas: `node descargador.js`

> **Nota de autenticación (Anime1v):** todos los endpoints excepto `/api/v1/anime/image-proxy` requieren API Key vía header `X-API-Key: <tu-clave>` o query param `?apiKey=<tu-clave>`.

---

## Estado de instalación (agosto 2026)

| Componente | Estado | Notas |
|------------|--------|-------|
| Node.js | ✅ v22.23.1 | ≥18 requerido |
| ffmpeg (sistema) | ✅ n8.1.2 | |
| `ffmpeg-static` | ✅ ambas APIs | |
| `yt-dlp` | ✅ v2026.07.04 | en `~/.local/bin/yt-dlp` (PATH agregado a `~/.bashrc`) |
| Puppeteer + Chromium | ✅ 148.0.7778.97 | caché compartido en `~/.cache/puppeteer` (~636MB) |
| peliapi `npm install` | ✅ | puerto `5555` |
| anime1v-api `npm install` | ✅ | puerto `3000` (el README dice 3001, el código usa 3000) |
| `.env` | ✅ | copiados de `.env.example` |

**Nota puppeteer/Chromium:** si `npm install` vuelve a fallar descargando Chromium (Google storage puede dar 403), usar el instalador oficial con mirror:

```bash
PUPPETEER_DOWNLOAD_BASE_URL=https://npmmirror.com/mirrors/chrome-for-testing npx puppeteer browsers install chrome chrome-headless-shell
```

## Pasos siguientes

1. ✅ Instalar dependencias del sistema (Node.js, ffmpeg, yt-dlp)
2. ✅ Clonar e instalar ambas APIs (PeliApi + Anime1v)
3. ⬜ Decidir framework de la app web **AkashiVerse** (PWA instalable en móviles + Android TV)
4. ⬜ Construir la app y levantarla

## Créditos

APIs originales creadas por **Feer (FxxMorgan)** — https://github.com/FxxMorgan/. No eliminar las firmas de autoría de los proyectos originales.
