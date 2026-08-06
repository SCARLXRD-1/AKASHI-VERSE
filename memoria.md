# Documentación de AkashiVerse y DevOps (Render)

## Despliegue en Render.com (Monorepo)

Tu proyecto consta de múltiples APIs (por ejemplo, `anime1v-api` y `peliapi`) y un cliente React (`app`) dentro del mismo repositorio.
Render.com soporta perfectamente despliegues en "Monorepos" usando el campo **Root Directory**.

A continuación, los pasos para subir cada API a Render de forma gratuita o de pago:

### 1. Subir la API de Películas (`peliapi`)
1. Ve a Render.com y crea un nuevo **Web Service**.
2. Conecta tu repositorio de GitHub.
3. En la configuración inicial, establece:
   - **Name:** `akashiverse-peliapi`
   - **Root Directory:** `peliapi`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (o `node server.js` dependiendo de tu package.json)
4. En la sección de **Environment Variables** (Variables de entorno), agrega:
   - `PORT`: `5555`
   - Si tu API usa Puppeteer (como `cinecalidad` o `cuevana`), es crucial agregar:
     - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: `true`
     - `PUPPETEER_EXECUTABLE_PATH`: `/usr/bin/google-chrome-stable`
     *(Nota: En Render, para que Puppeteer funcione bien, puede que necesites usar un entorno Docker o especificar dependencias adicionales de Chrome. Sin embargo, con **Unlimplay**, los requerimientos pesados de scraping se reducen drásticamente ya que devuelve JSON directo).*

### 2. Subir la API de Anime (`anime1v-api`)
1. Crea un nuevo **Web Service** en Render.
2. Selecciona el mismo repositorio.
3. Configuración:
   - **Name:** `akashiverse-animeapi`
   - **Root Directory:** `anime1v-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. En **Environment Variables**:
   - `PORT`: `4000`
   - Cualquier otra variable que tengas en el `.env` local de esa carpeta.

### 3. Subir el Frontend (`app`)
Para el frontend React (Vite):
1. Crea un **Static Site** en Render.
2. Selecciona el repositorio.
3. Configuración:
   - **Root Directory:** `app`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. En **Environment Variables**, es fundamental reescribir las URLs a las nuevas APIs de Render (si usas variables `.env` estáticas) o asegurarte de usar el proxy correctamente, por ejemplo:
   - `VITE_API_URL`: `https://akashiverse-peliapi.onrender.com`
   - `VITE_ANIME_API_URL`: `https://zenkai-anime.onrender.com`
   *(Asegúrate de que estas rutas concuerden con lo que tu código en `api.ts` o `config.ts` necesita).*

## Notas Adicionales sobre Unlimplay
El nuevo proveedor **Unlimplay** ha sido integrado a `peliapi`.
- Se requiere el parámetro `tmdbId` en las peticiones `/servers` para que Unlimplay pueda ejecutarse.
- Si `/api/v1/content/servers?tmdbId=12345` es ejecutado, la API intentará usar Unlimplay primero y, si falla, hará un "cascade" (búsqueda en cascada) por el resto de los proveedores.
- Al usar IDs numéricos en el frontend, puedes pasarlos directamente en tus llamadas y evitar depender excesivamente del scraping.

## TV en Vivo (Placeholder)
- Se preparó la base para la sección de **TV en Vivo** (`/tv`), pero actualmente se encuentra en modo "Próximamente" debido a ajustes de diseño pendientes.
# Documentación de AkashiVerse y DevOps (Render)

## Despliegue en Render.com (Monorepo)

Tu proyecto consta de múltiples APIs (por ejemplo, `anime1v-api` y `peliapi`) y un cliente React (`app`) dentro del mismo repositorio.
Render.com soporta perfectamente despliegues en "Monorepos" usando el campo **Root Directory**.

A continuación, los pasos para subir cada API a Render de forma gratuita o de pago:

### 1. Subir la API de Películas (`peliapi`)
1. Ve a Render.com y crea un nuevo **Web Service**.
2. Conecta tu repositorio de GitHub.
3. En la configuración inicial, establece:
   - **Name:** `akashiverse-peliapi`
   - **Root Directory:** `peliapi`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (o `node server.js` dependiendo de tu package.json)
4. En la sección de **Environment Variables** (Variables de entorno), agrega:
   - `PORT`: `5555`
   - Si tu API usa Puppeteer (como `cinecalidad` o `cuevana`), es crucial agregar:
     - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: `true`
     - `PUPPETEER_EXECUTABLE_PATH`: `/usr/bin/google-chrome-stable`
     *(Nota: En Render, para que Puppeteer funcione bien, puede que necesites usar un entorno Docker o especificar dependencias adicionales de Chrome. Sin embargo, con **Unlimplay**, los requerimientos pesados de scraping se reducen drásticamente ya que devuelve JSON directo).*

### 2. Subir la API de Anime (`anime1v-api`)
1. Crea un nuevo **Web Service** en Render.
2. Selecciona el mismo repositorio.
3. Configuración:
   - **Name:** `akashiverse-animeapi`
   - **Root Directory:** `anime1v-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. En **Environment Variables**:
   - `PORT`: `4000`
   - Cualquier otra variable que tengas en el `.env` local de esa carpeta.

### 3. Subir el Frontend (`app`)
Para el frontend React (Vite):
1. Crea un **Static Site** en Render.
2. Selecciona el repositorio.
3. Configuración:
   - **Root Directory:** `app`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. En **Environment Variables**, es fundamental reescribir las URLs a las nuevas APIs de Render (si usas variables `.env` estáticas) o asegurarte de usar el proxy correctamente, por ejemplo:
   - `VITE_API_URL`: `https://akashiverse-peliapi.onrender.com`
   - `VITE_ANIME_API_URL`: `https://zenkai-anime.onrender.com`
   *(Asegúrate de que estas rutas concuerden con lo que tu código en `api.ts` o `config.ts` necesita).*

## Notas Adicionales sobre Unlimplay
El nuevo proveedor **Unlimplay** ha sido integrado a `peliapi`.
- Se requiere el parámetro `tmdbId` en las peticiones `/servers` para que Unlimplay pueda ejecutarse.
- Si `/api/v1/content/servers?tmdbId=12345` es ejecutado, la API intentará usar Unlimplay primero y, si falla, hará un "cascade" (búsqueda en cascada) por el resto de los proveedores.
- Al usar IDs numéricos en el frontend, puedes pasarlos directamente en tus llamadas y evitar depender excesivamente del scraping.

## TV en Vivo (Placeholder)
- Se preparó la base para la sección de **TV en Vivo** (`/tv`), pero actualmente se encuentra en modo "Próximamente" debido a ajustes de diseño pendientes.
- La ruta fue agregada al enrutador (`App.tsx`) y a la navegación superior (`TopBar.tsx`).

## Detección de App Nativa (Capacitor)
- En el componente `TopBar.tsx`, se añadió la constante `isNativeApp` que verifica la existencia de `window.Capacitor`.
- Si el usuario navega desde la app nativa (APK/Android/TV), el botón "Descargar App" se ocultará automáticamente.

## Próximos Pasos / Tareas Pendientes
- **UI y Responsividad en Móviles (Android):** Arreglar el espacio superior (Safe Area / Padding) en la barra de navegación (Header/TopBar). Actualmente, en la versión de la app instalada (APK), el logo y los botones de menú chocan y se superponen con la barra de estado del sistema (batería, hora, señal).
- **Botón de Retroceso Nativo (Android):** Dar soporte al botón de retroceso físico/gestual de los móviles usando Capacitor (`App.addListener('backButton')`) para que navegue hacia atrás en lugar de cerrar la app o no hacer nada.
- **Reproductor de Video (Bucle de Carga):** Revisar por qué el reproductor nativo se queda en un bucle infinito (cargando constantemente) al reproducir películas/series/animes que sí tienen servidores válidos disponibles.
- **Servidores de Anime:** Investigar la causa de los errores "Error al cargar los servidores" en animes específicos (ej. Dandelion) para determinar si es un problema del endpoint, del mapeo o de que el proveedor realmente no tiene el contenido.
- **Bloqueos de Extracción (Películas/Series):** Se registran mensajes como "El proveedor bloqueó la extracción" (ej. en *Reflejo de Ti* o *El cielo te está esperando*). Esto ocurre porque servicios como DoodStream, SBFast o Mystream detectan la IP del servidor (Render) y bloquean el scraping (403 Forbidden). Habrá que mejorar los `resolvers` o implementar una caída (fallback) que abra el `embedUrl` directo si falla la extracción del MP4 nativo.

## Actualizaciones Recientes (Agosto 2026)

### 1. Correcciones de Bugs (TypeScript y Lógica)
- **Pantalla de Inicio (Episodios Recientes):** Se corrigió la consulta en la pantalla principal para que llame a `animeApi.recentEpisodes()` y navegue directamente al reproductor del episodio recién salido, separándolo de la lógica general del catálogo de anime.
- **Errores de Tipado en Favoritos:** Se arreglaron errores de TypeScript al pasar `urlParams` y `rank` de forma innecesaria al componente `MediaCard`. Se estandarizó la interfaz `HistoryEntry` en el hook `useFavorites.ts` para mantener coherencia en las firmas de tipos.
- **Filtros del Catálogo:** Se corrigió el uso de `matchesAnimeCategory(item, animeType, false)` en `Catalog.tsx`, pasando los tres parámetros requeridos por la firma.

### 2. Soporte y Optimización para Smart TV
- **Android Manifest (Leanback):** Se inyectaron configuraciones en `AndroidManifest.xml` (`android.software.leanback`, `LEANBACK_LAUNCHER`, `touchscreen required="false"`) para que el APK generado sea 100% compatible y nativo en Android TV.
- **Navegación con Control Remoto (D-Pad):** Se actualizó el hook `useSpatialNav.ts` añadiendo `e.preventDefault()` en la tecla "Enter" para evitar que el navegador envíe clics dobles al invocar `.click()` de forma programática.
- **Estilos Visuales de TV:** Se añadió una clase CSS global para `[data-focus="true"]` en `index.css`, proveyendo de un contorno brillante (outline), transformaciones de escala y sobras (box-shadow) que aseguran que el usuario de TV jamás pierda de vista el elemento seleccionado por su control remoto.

### 3. Rediseño y Despliegue de APK Nativos
- **Rediseño de la sección Apps:** La pantalla `Apps.tsx` pasó de ser un texto básico a una **Landing Page Premium** empleando fondos radiales, diseño Glassmorphism, y micro-animaciones en tarjetas. Ahora muestra claramente los beneficios de las versiones Móvil y TV de AkashiVerse.
- **Descargas Directas (Forzadas):** Se añadió el atributo HTML `download` a las anclas de descarga, asegurando que las rutas de los instaladores no sean interceptadas por el enrutamiento de la SPA.
- **Compilación de APK Local con Java 17:** Se resolvieron incompatibilidades (Java `invalid source release: 21`) entre Capacitor 8 y el JDK del sistema mediante la modificación de las directivas `sourceCompatibility JavaVersion.VERSION_17` en los distintos archivos `build.gradle` (core, app, plugins), lo que permitió la correcta compilación mediante `gradlew assembleDebug`.
