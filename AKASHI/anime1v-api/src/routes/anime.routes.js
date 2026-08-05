const express = require("express");
const https   = require("https");
const http    = require("http");
const { requireApiKey } = require("../middlewares/auth");
const { dailyRateLimit } = require("../middlewares/rate-limit");
const animeService = require("../services/anime.service");
const downloadService = require("../services/download.service");
const { ApiError } = require("../utils/api-error");
const { cacheMiddleware } = require("../middlewares/cache");

const router = express.Router();

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

router.get("/image", async (req, res) => {
  const { url } = req.query;
  const allowedDomains = /animeflv\.net|animeav1\.com|shinanime\.com|cloudinary\.com|googleusercontent\.com|msn\.com|fbcdn\.net/i;
  
  if (!url || !allowedDomains.test(url)) {
    console.warn(`[ImageProxy] Denied: ${url}`);
    return res.status(400).send("URL inválida o dominio no permitido");
  }

  try {
    console.log(`[ImageProxy] Fetching: ${url}`);
    const axios = require("axios");
    const imgUrl = new URL(url);
    
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        "Referer": `https://${imgUrl.hostname}/`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      }
    });

    console.log(`[ImageProxy] Status: ${response.status} for ${url}`);
    res.status(response.status);
    res.setHeader("Content-Type", response.headers["content-type"] || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("X-Frame-Options");

    response.data.pipe(res);
  } catch (err) {
    if (err.response) {
      console.error(`[ImageProxy] Error ${err.response.status}: ${url}`);
      res.status(err.response.status).send(`Error de origen: ${err.response.statusText}`);
    } else {
      console.error(`[ImageProxy] Fatal Error: ${err.message} for ${url}`);
      res.status(502).send("Error al obtener imagen");
    }
  }
});

router.use(requireApiKey, dailyRateLimit);

router.get(
  "/search",
  cacheMiddleware(1800), // Cache por 30 mins
  asyncHandler(async (req, res) => {
    const response = await animeService.searchAnime(req.query.q, req.query.domain, req.query);
    res.status(200).json(response);
  })
);

router.get(
  "/info",
  cacheMiddleware(3600), // Cache por 1 hora
  asyncHandler(async (req, res) => {
    if (!req.query.url) {
      throw new ApiError(400, "Se requiere el parametro url");
    }

    const response = await animeService.getAnimeInfo(req.query.url);
    res.status(200).json(response);
  })
);

router.get(
  "/home",
  cacheMiddleware(1800), // Cache por 30 mins
  asyncHandler(async (req, res) => {
    const response = await animeService.getHome(req.query.domain);
    res.status(200).json(response);
  })
);

router.get(
  "/episode",
  asyncHandler(async (req, res) => {
    if (!req.query.url) {
      throw new ApiError(400, "Se requiere el parametro url");
    }

    const response = await animeService.getEpisodeLinks(req.query.url, req.query.includeMega, req.query.excludeServers);
    res.status(200).json(response);
  })
);

router.post(
  "/download",
  asyncHandler(async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = downloadService.createDownload(req.body || {}, baseUrl);

    res.status(200).json({
      success: true,
      data,
    });
  })
);

router.get(
  "/download/:id",
  asyncHandler(async (req, res) => {
    const data = downloadService.getDownload(req.params.id);

    res.status(200).json({
      success: true,
      data,
    });
  })
);

router.post(
  "/batch-download",
  asyncHandler(async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = downloadService.createBatch(req.body || {}, baseUrl);

    res.status(200).json({
      success: true,
      data,
    });
  })
);

router.get(
  "/batch/:id",
  asyncHandler(async (req, res) => {
    const data = downloadService.getBatch(req.params.id);

    res.status(200).json({
      success: true,
      data,
    });
  })
);

module.exports = router;
