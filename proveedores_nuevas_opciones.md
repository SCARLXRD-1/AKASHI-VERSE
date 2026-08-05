# Análisis de Proveedores Candidatos

## Estado actual del proyecto

| Proveedor actual | Tipo | Velocidad | Películas | Series | Anime |
|-----------------|------|-----------|-----------|--------|-------|
| PelisPlus | Cheerio | Rápido | ✅ | ✅ | ❌ |
| RePelisHD | Cheerio | Rápido | ✅ | ❌ | ❌ |
| Cuevana3 | Cheerio | Rápido | ✅ | ✅ | ❌ |

---

## Proveedores analizados

### ✅ RECOMENDADOS (Scraping viable, contenido disponible)

#### 1. CineCalidad (.am / .rs / .fm / .onl) — MUY RECOMENDADO
- **URLs activas**: cinecalidad.am, cinecalidad.rs, cinecalidad.fm, cinecalidad.onl (4 mirrors)
- **Contenido**: Películas + Series + Anime
- **Scraping**: Cheerio (rápido, sin Puppeteer)
- **Búsqueda**: `?s=query` — funciona, devuelve artículos con títulos y links
- **Estructura URLs**: `/ver-pelicula/slug/`, `/ver-serie/slug/`
- **Imágenes**: TMDB CDN (`image.tmdb.org/t/p/w342/`)
- **Problema**: Los embeds NO están en el HTML — se cargan vía JavaScript con sistema "metaframe" desde `cinecalidad.ec`
- **Solución**: Necesita Puppeteer para extraer embeds O reverse-engineering del API de metaframe
- **Prioridad**: ⭐⭐⭐⭐ (alto contenido, scraping de búsqueda rápido, solo falta resolver embeds)

#### 2. PelisPedia — RECOMENDADO CON RESTRICCIONES
- **URL**: pelispedia.mov
- **Contenido**: Películas + Series
- **Scraping**: Cheerio para listing, pero embeds necesitan Puppeteer
- **Búsqueda**: No tiene endpoint de búsqueda funcional (todos devuelven homepage)
- **Estructura URLs**: `/pelicula/slug-ID`, `/serie/slug/temporada/X/capitulo/Y`
- **Embeds**: Usa proxy `/vidurl/ttID/` que carga desde `embed69.org`
- **Problema 1**: Sin búsqueda funcional
- **Problema 2**: embed69.org tiene Proof of Work (anti-bot)
- **Problema 3**: Los servidores no están en el HTML — se cargan vía JS
- **Prioridad**: ⭐⭐ (muy limitado sin búsqueda)

### ⚠️ PARCIALES (Funcionan pero con limitaciones)

#### 3. AnimeYT — PARA ANIME
- **URL**: animeyt.cc
- **Contenido**: Solo anime
- **Scraping**: WordPress, Cheerio
- **Búsqueda**: `?s=query` — funciona
- **Estructura URLs**: `/category/slug/`, `/ID/anime/slug-capitulo-X/`
- **Problema**: No se encontraron tipos de servidor en el HTML (embeds vía JS)
- **Prioridad**: ⭐⭐⭐ (bueno para anime si se resuelven embeds)

#### 4. AnimeD23 — PARA ANIME
- **URL**: animed23.com
- **Contenido**: Solo anime (Sub, Latino, Castellano)
- **Scraping**: Cheerio
- **Búsqueda**: `?s=query` — funciona, devuelve artículos
- **Estructura URLs**: `/anime/slug/`
- **Problema**: Embeds no verificados aún
- **Prioridad**: ⭐⭐⭐ (bueno para anime)

#### 5. MonosChinos — PARA ANIME
- **URL**: vww.monoschinos2.net
- **Contenido**: Solo anime
- **Scraping**: Cheerio
- **Búsqueda**: `/buscar?q=query` — funciona parcialmente
- **Prioridad**: ⭐⭐ (limitado)

### ❌ NO RECOMENDADOS (Bloqueados o no funcionales)

| Proveedor | Razón |
|-----------|-------|
| inkapelis.cyou | Conexión fallida (sitio caído) |
| seriesyonkis.cx | 403 Forbidden (bloqueado) |
| animeonline.ninja | 403 Forbidden (bloqueado) |
| seriesflv.sbs | 403 Forbidden (bloqueado) |
| gnula.cc | 403 Forbidden (bloqueado) |
| series24.sbs | 403 Forbidden (bloqueado) |
| katanime.net | Búsqueda no funcional |
| plex.tv | API oficial, requiere suscripción/API key |

---

## Recomendación final

### Implementar en orden de prioridad:

1. **CineCalidad** (cinecalidad.am como primario, .rs como fallback)
   - Tipo: Películas + Series + Anime
   - Método: Cheerio para listing + Puppeteer para embeds
   - Ventaja: 4 mirrors disponibles, contenido amplio

2. **AnimeYT** o **AnimeD23** (para anime)
   - Tipo: Solo anime
   - Método: Cheerio
   - Ventaja: Contenido anime complementario a los actuales

### Notas técnicas:
- CineCalidad usa el sistema "DooPlay" (mismo CMS que PelisPlus pero configuración diferente)
- Los embeds de CineCalidad se cargan desde `cinecalidad.ec` vía metaframe
- PelisPedia usa embed69.org como proxy con protección anti-bot
- La mayoría de sitios de anime usan WordPress con embeds vía JavaScript

NUevas opciones

https://seriesflixhd.ws/
https://www.pelisplushd.la/
https://www.poseidonhd2.co/
