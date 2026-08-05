<div align="center">
  <img src="https://raw.githubusercontent.com/hackerscarlxrd-byte/zenkai_anime/main/zenkai%20anime%20logo.jpeg" alt="Zenkai Anime Logo" width="200"/>
  <h1>Zenkai Anime</h1>
  <p><strong>El motor de streaming de anime definitivo.</strong></p>
</div>

---

**Zenkai Anime** es una aplicación de streaming moderna, construida con React, Tailwind CSS y Firebase, diseñada para brindar la mejor experiencia de usuario con un rendimiento ultrarrápido y un diseño espectacular (Glassmorphism, Dark Mode y animaciones fluidas). Cuenta además con su propio backend robusto en Node.js que escrapea e indexa capítulos utilizando Puppeteer.

## ✨ Características Principales

- **Diseño Premium:** Interfaz de usuario altamente inmersiva, inspirada en las mejores plataformas de streaming a nivel global.
- **Catálogo Dinámico:** Explora, busca y filtra cientos de animes populares y recientes.
- **Sistema de Cuentas (Firebase):** Sincronización en la nube de tu Historial de visualización, Lista de Favoritos y Estadísticas de perfil.
- **Reproductor Personalizado:** Un reproductor de video integrado con controles nativos (Acelerar, Rebobinar 10s, Saltar intro, Cambio de calidad).
- **Multiplataforma:** Disfrútalo en tu navegador web o descarga la aplicación móvil (APK) compilada de forma nativa para Android usando Capacitor.

---

## 🛠️ Stack Tecnológico

**Frontend (`anime-web`):**
- Vite + React.js
- Tailwind CSS (Estilos y Animaciones)
- Zustand (Gestión de estado)
- Firebase (Autenticación y Base de Datos)
- Framer Motion (Transiciones)
- Capacitor (Conversión a Android Nativo)

**Backend (`anime1v-api`):**
- Node.js + Express
- Puppeteer (Web Scraping avanzado)
- Axios & Cheerio (Extracción de datos)

---

## 🚀 Instalación y Despliegue Local

Sigue estos pasos para correr el proyecto en tu entorno local:

### 1. Clonar el Repositorio
```bash
git clone https://github.com/hackerscarlxrd-byte/zenkai_anime.git
cd zenkai_anime
```

### 2. Configurar el Backend (API)
```bash
cd anime1v-api
npm install
# Crea un archivo .env basándote en el .env.example
npm run dev
```
La API estará corriendo por defecto en `http://localhost:3000`.

### 3. Configurar el Frontend (Web)
Abre una nueva terminal en la raíz del proyecto:
```bash
cd anime-web
npm install
```
Asegúrate de crear un archivo `.env` en `anime-web` con tus variables de entorno de Firebase y la URL de la API:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_FIREBASE_API_KEY="tu-api-key"
# ... el resto de tus variables de Firebase
```
Ejecuta el entorno de desarrollo:
```bash
npm run dev
```

---

## 📱 Compilar App Móvil (Android)

Para generar el APK de Android necesitas tener instalado Android Studio:
```bash
cd anime-web
npm run build
npx cap sync android
npx cap open android
```
Desde Android Studio podrás compilar el archivo `.apk` oficial firmado.

---

## 🤝 Créditos y Agradecimientos

Este proyecto es posible gracias al código open-source.
**Mención Especial:** El backend de este proyecto (`anime1v-api`) fue reconstruido y está basado en el increíble trabajo de la comunidad y de **[FxxMorgan](https://github.com/FxxMorgan)**. Se ha modificado y optimizado con fines de integración nativa para Zenkai Anime.

---

<div align="center">
  <sub>Desarrollado con ❤️ para la comunidad otaku.</sub>
</div>
