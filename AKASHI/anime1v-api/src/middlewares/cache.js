const NodeCache = require("node-cache");

// Configurar cache:
// stdTTL: Tiempo de vida estándar de 30 minutos (1800 segundos)
// checkperiod: Limpiar entradas expiradas cada 10 minutos (600 segundos)
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 600 });

function cacheMiddleware(duration) {
  return (req, res, next) => {
    // Si la solicitud no es GET, pasar al siguiente middleware
    if (req.method !== "GET") {
      return next();
    }

    // Usar la URL original como clave de caché
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      // Si existe en caché, devolver la respuesta
      return res.status(200).json(cachedResponse);
    } else {
      // Si no existe, interceptar el método res.json para guardar en caché
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Guardar la respuesta en caché si el status es exitoso (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, body, duration || 1800);
        }
        originalJson(body);
      };
      next();
    }
  };
}

// Función auxiliar para limpiar la caché manualmente si es necesario
function clearCache() {
  cache.flushAll();
}

module.exports = {
  cacheMiddleware,
  clearCache,
};
