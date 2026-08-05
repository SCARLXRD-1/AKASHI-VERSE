# AkashiVerse — Plan de la App Web (PWA Instalable)

## Visión General
**AkashiVerse** es una aplicación web progresiva (PWA) para streaming de películas, series y anime que funciona en móvil, escritorio y Android TV / Google TV. Consume dos APIs open-source de FxxMorgan:
- **PeliApi** (puerto 5555): películas y series — PelisPlus, RePelisHD, Cuevana3
- **Anime1v API** (puerto 3000): anime — AnimeAV1, AnimeFLV, TioAnime, HentaiLA, JKAnime, MonosChinos

**Objetivo:** experiencia estilo Netflix combinando lo mejor de cada app de streaming, con:
- Historial de visualización
- Bloqueo de pop-ups/anuncios integrados (fuentes de terceros)
- Catálogo con fechas de estreno
- Autoreproducción / "Siguiente episodio"
- "Continuar viendo"
- UI 10-foot para TV + navegación por d-pad

---

## Stack Técnico
| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + TypeScript + Vite 8 |
| PWA | `vite-plugin-pwa` (Workbox) — manifest, SW, cache |
| Routing | `react-router-dom` v7 |
| Video | `hls.js` para streams `.m3u8` + `<video>` nativo |
| Estado local | `localStorage` / `IndexedDB` (historial, preferencias) |
| Estilos | CSS nativo con variables (design system en `index.css`) |
| Navegación TV | Hook `useSpatialNav` (DOM rects + arrow keys) |

---

## Arquitectura de la App

```
src/
├── main.tsx                 # Entry: router + SW register + providers
├── App.tsx                  # Layout: TopBar + Outlet + Toast/Modal
├── index.css                # Design system completo
├── lib/
│   ├── config.ts            # URLs de APIs + key (VITE_*)
│   ├── api.ts               # Clientes normalizados (peliApi, animeApi)
│   ├── storage.ts           # Wrappers localStorage/IndexedDB
│   └── player/
│       └── hlsPlayer.ts     # Wrapper hls.js con cleanup
├── hooks/
│   ├── useSpatialNav.ts     # Navegación d-pad/TV
│   ├── useHistory.ts        # Historial + continue-watching
│   ├── useAutoplay.ts       # Lógica next-episode + countdown
│   └── usePopupBlocker.ts   # Interceptor de pop-ups en iframes
├── components/
│   ├── TopBar.tsx           # Brand + nav + search (sticky)
│   ├── MediaCard.tsx        # Tarjeta 2:3 con foco TV
│   ├── SectionRow.tsx       # Fila horizontal con scroll + título
│   ├── ContinueWatching.tsx # Fila "Continuar viendo"
│   ├── EpisodeSelector.tsx  # Modal/panel episodios (anime/series)
│   ├── VideoPlayer.tsx      # <video> + hls.js + controles custom
│   ├── SkipIntro.tsx        # Botón "Saltar intro" (detectado o manual)
│   └── Toast.tsx            # Notificaciones
├── pages/
│   ├── Home.tsx             # Hero + 3 secciones (pelis, series, anime)
│   ├── Catalog.tsx          # /peliculas, /series, /anime (paginado)
│   ├── Search.tsx           # Búsqueda unificada
│   ├── Detail.tsx           # Info película/serie (temporadas/eps)
│   ├── AnimeDetail.tsx      # Info anime + selector episodios
│   ├── Watch.tsx            # Reproductor unificado
│   └── History.tsx          # Historial completo + filtros
└── types/
    └── index.ts             # MediaItem, Episode, HistoryEntry, etc.
```

---

## Funcionalidades Detalladas

### 1. Historial de Visualización (`History` + `ContinueWatching`)
- **Persistencia:** `localStorage` (clave `akashiverse:history`) con límite 500 items; migración a IndexedDB si crece.
- **Entrada:** `{ mediaId, kind, title, poster, episode?, season?, progress, duration, timestamp, provider, streamUrl? }`
- **UI:**
  - `/historial` → lista completa con filtros (tipo, proveedor, fecha).
  - Fila "Continuar viendo" en Home (top) con tarjetas que muestran barra de progreso y botón "Reanudar".
- **Limpieza:** botón "Borrar historial" + auto-purge > 90 días.

### 2. Bloqueo de Pop-ups / Anuncios (Crítico)
Fuentes de terceros (iframes de servidores) inyectan pop-ups, redirecciones y overlays. Estrategia en capas:

| Capa | Mecanismo |
|------|-----------|
| **CSP / sandbox** | Iframes con `sandbox="allow-scripts allow-same-origin allow-forms"` (sin `allow-popups`, `allow-popups-to-escape-sandbox`, `allow-top-navigation`). |
| **Intercept fetch** | Service Worker intercepta requests a dominios conocidos de ads/trackers y responde 204. Lista actualizable desde JSON remoto. |
| **Overlay guard** | En `VideoPlayer`, `window.open = () => null` dentro del player; `referrerpolicy="no-referrer"` + `allow="fullscreen"` mínimo en iframes cross-origin. |
| **Proxy de embeds** | Opcional: endpoint propio `/proxy/embed?url=` que fetchea el iframe, limpia scripts/ads y re-sirve en origen propio. Requiere backend Node extra; v2. |

**MVP:** CSP sandbox + SW ad-block list + `window.open` override en player.

### 3. Catálogo Estilo Netflix
- **Filas horizontales** (`SectionRow`) con scroll nativo + snap.
- **Metadatos en tarjeta:** año, rating, género, "Nuevo" badge (si fecha < 30 días).
- **Secciones:** "Estrenos esta semana", "Tendencias", "Por género", "Por año".
- **Paginación infinita** (IntersectionObserver) en `/peliculas`, `/series`, `/anime`.

### 4. Autoreproducción / "Siguiente Episodio"
- En `Watch` (series/anime): al terminar episodio (`ended` event), cuenta regresiva 10s ("Siguiente en 10s") con botón "Cancelar".
- Auto-skip intro: detección heurística (capítulos marcados, o botón manual "Saltar intro" guardando timestamp por serie).
- Persistencia de posición: `timeupdate` cada 5s → `localStorage` → resume exacto.

### 5. UI 10-foot + Navegación TV (Android TV / Google TV)
- **Hook `useSpatialNav`** ya implementado: movimiento por rects (up/down/left/right) + Enter/Click.
- **Foco visible:** anillo vermillion + `transform: scale(1.03)` + `scrollIntoView({behavior: 'smooth', block: 'nearest'})`.
- **Teclas:** Arrow keys, Enter, Escape (volver), Backspace (atrás), Media keys (play/pause).
- **Safe area:** `viewport-fit=cover` + `env(safe-area-inset-*)` para notches/TV overscan.
- **Tipografía:** mínimo 1.2rem en TV (media query `@media (hover: none) and (pointer: coarse)`).

### 6. Reproductor (`VideoPlayer`)
- Wrapper `hls.js` con:
  - `autoStartLoad: true`, `startLevel: -1` (auto), `capLevelToPlayerSize: true`
  - `xhrSetup` para inyectar `Referer` + `User-Agent` (evita 403 en HLS)
  - `onError` recovery: `recoverMediaError`, `fatal` → fallback a siguiente servidor
- Controles custom: play/pause, seek bar, volumen, fullscreen, speed (0.5x–2x), subtítulos (vtt/srt), PiP.
- **Teatro mode:** botón que oculta UI salvo player + fondo negro.
- **Subtítulos externos:** API devuelve `.vtt` → cargar en `<track>`.

### 7. Búsqueda Unificada
- Paralelo: `peliApi.search(q)` + `animeApi.search(q)` → merge deduplicado por título normalizado.
- Debounce 300ms en input TopBar.
- Resultados con badge de proveedor + tipo.

### 8. Detalle Película / Serie (PeliApi)
- `GET /api/v1/content/info/:slug?type=movie|serie`
- Render: poster, título, año, rating, géneros, sinopsis, elenco, director.
- **Película:** botón "Reproducir" → resuelve servidor → `Watch`.
- **Serie:** tabs de temporada → grid episodios → click → `Watch?slug&season&episode`.

### 9. Detalle Anime (Anime1v)
- `GET /api/v1/anime/info?url=` → info + episodios array.
- Selector de episodios (lista o modal) con badge SUB/DUB.
- Click episodio → `episodeLinks` → servidores → `resolve` → `Watch`.

### 10. PWA / Instalación
- Manifest: `display: standalone`, `orientation: any`, `shortcuts` (Buscar, Historial, Anime).
- SW: `NetworkFirst` para API, `CacheFirst` para imágenes, `StaleWhileRevalidate` para HTML/JS/CSS.
- Iconos: 192, 512, maskable 512 (ya en `public/`).
- `beforeinstallprompt` → toast "Instalar app" en móvil/TV.

---

## Flujo de Datos Clave

```
Usuario abre app
  │
  ├─ Home → peliApi.catalog({type:'movie'}) + peliApi.catalog({type:'serie'}) + animeApi.catalog(1)
  │       └─ Render SectionRow × 3
  │
  ├─ Click tarjeta → Detail (peli) / AnimeDetail (anime)
  │       │
  │       ├─ Película: botón "Reproducir" → servers → resolve → Watch
  │       └─ Serie/Anime: selector episodio → servers → resolve → Watch
  │
  ├─ Watch → hls.js carga stream
  │       ├─ timeupdate c/5s → save position (history)
  │       ├─ ended → useAutoplay → next episode (si serie/anime)
  │       └─ close → history entry + continue-watching update
  │
  └─ Historial → /historial (lista completa) + fila Home "Continuar viendo"
```

---

## Configuración de Entorno (`.env` en `app/`)

```bash
VITE_PELI_API_URL=http://localhost:5555
VITE_ANIME_API_URL=http://localhost:3000
VITE_ANIME_API_KEY=dev-anime1v-key
VITE_ADBLOCK_LIST_URL=...  # opcional
```

---

## Tareas de Implementación (Orden Sugerido)

| # | Tarea | Archivos Clave |
|---|-------|----------------|
| 1 | `types/index.ts` + `lib/storage.ts` | Tipos + persistencia |
| 2 | `hooks/useHistory.ts` + `useAutoplay.ts` + `usePopupBlocker.ts` | Lógica transversal |
| 3 | `components/VideoPlayer.tsx` + `lib/player/hlsPlayer.ts` | Reproductor core |
| 4 | `pages/Watch.tsx` | Pantalla reproducción |
| 5 | `pages/Detail.tsx` (peli) + `AnimeDetail.tsx` | Detalle + selector eps |
| 6 | `pages/History.tsx` | Historial completo |
| 7 | `components/ContinueWatching.tsx` + integración en `Home.tsx` | Fila resume |
| 8 | `usePopupBlocker.ts` → integrar en `VideoPlayer` (iframe sandbox + SW) | Anti-popups |
| 9 | Refinar `Catalog.tsx` (badges "Nuevo", géneros, scroll snap) | Catálogo Netflix |
| 10 | PWA polish: shortcuts, install prompt, offline fallback | `vite.config.ts`, `main.tsx` |
| 11 | Test en Android TV (Chrome / WebView) + mobile | — |

---

## Consideraciones de Seguridad / Legal
- **No alojar contenido:** la app solo indexa y reproduce streams de terceros.
- **Créditos obligatorios:** mantener headers `X-Powered-By: FxxMorgan` y logs de consola de las APIs (licencia original).
- **CSP estricto:** `script-src 'self'; frame-src https:; connect-src 'self' https://api.dominios...; img-src https: data:;`
- **Rate limit:** respetar límites de las APIs (100 req/día anime1v por defecto).

---

## Próximos Pasos Inmediatos
1. ✅ Aprobado este plan.
2. Crear `types/index.ts` y `lib/storage.ts`.
3. Implementar `VideoPlayer` + `Watch` (core de la experiencia).
4. Detalle + historial.

---

*Generado: 2026-08-03 — AkashiVerse v0.1-plan*
