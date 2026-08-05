FROM ghcr.io/puppeteer/puppeteer:latest

# Cambiar a usuario root temporalmente para copiar archivos
USER root

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Dar permisos al usuario pptruser
RUN chown -R pptruser:pptruser /app

# Volver al usuario de puppeteer por seguridad
USER pptruser

# Exponer el puerto
EXPOSE 10000

# Comando para iniciar
CMD ["npm", "start"]
