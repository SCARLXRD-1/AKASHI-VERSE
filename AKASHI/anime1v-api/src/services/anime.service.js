const axios = require("axios");
const { URL } = require("node:url");
const { ApiError } = require("../utils/api-error");
const animeav1Service = require("./animeav1.service");
const jkanimeService = require("./jkanime.service");
const animeflvService = require("./animeflv.service");
const hentailaService = require("./hentaila.service");
const tioanimeService = require("./tioanime.service");
const monoschinosService = require("./monoschinos.service");

const DEFAULT_ANIME_DOMAIN = process.env.DEFAULT_ANIME_DOMAIN || "animeav1.com";

const PROVIDERS = [
  {
    id: "animeav1",
    label: "AnimeAV1",
    domains: [DEFAULT_ANIME_DOMAIN, "animeav1.com", "www.animeav1.com"],
    service: animeav1Service,
  },
  {
    id: "jkanime",
    label: "JKAnime",
    domains: ["jkanime.net", "www.jkanime.net"],
    service: jkanimeService,
  },
  {
    id: "animeflv",
    label: "AnimeFLV",
    domains: ["animeflv.net", "www.animeflv.net", "www4.animeflv.net"],
    service: animeflvService,
  },
  {
    id: "hentaila",
    label: "HentaiLA",
    domains: ["hentaila.com", "www.hentaila.com"],
    service: hentailaService,
  },
  {
    id: "tioanime",
    label: "TioAnime",
    domains: ["tioanime.com", "www.tioanime.com"],
    service: tioanimeService,
  },
  {
    id: "monoschinos",
    label: "MonosChinos",
    domains: ["monoschinos2.com", "www.monoschinos2.com"],
    service: monoschinosService,
  },
  {
    id: "myanimelist",
    label: "MyAnimeList",
    domains: ["myanimelist.net", "www.myanimelist.net"],
    service: {
      getAnimeInfo: async (url) => {
        const malIdMatch = url.match(/anime\/(\d+)/);
        const malId = malIdMatch ? malIdMatch[1] : null;
        if (!malId) return { success: false };
        const res = await axios.get(`https://api.jikan.moe/v4/anime/${malId}`);
        const anime = res.data.data;
        return {
          success: true,
          data: {
            id: malId,
            title: anime.title,
            titleJapanese: anime.title_japanese,
            description: anime.synopsis,
            image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
            backdrop: anime.trailer?.images?.maximum_image_url || null,
            status: (() => {
              if (anime.status === "Not yet aired") return "Próximamente";
              if (anime.status === "Finished Airing") return "Finalizado";
              return "En emisión";
            })(),
            type: anime.type,
            year: anime.year,
            score: anime.score ? String(anime.score) : null,
            url: url,
            totalEpisodes: anime.episodes,
            genres: (anime.genres || []).map(g => ({ name: g.name, slug: g.name.toLowerCase(), id: null })),
            relatedAnimes: [],
            episodes: [] // It's upcoming or from MAL, no episodes
          },
          source: 'myanimelist'
        };
      }
    }
  }
];

function normalizeDomain(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.includes("://")) {
      return new URL(trimmed).hostname.toLowerCase();
    }
    return new URL(`https://${trimmed}`).hostname.toLowerCase();
  } catch (_error) {
    if (_error.message) console.debug("normalizeDomain error", _error.message);
    return trimmed.split("/")[0];
  }
}

function domainMatches(domain, candidate) {
  if (!domain || !candidate) {
    return false;
  }

  if (domain === candidate) {
    return true;
  }

  return domain.endsWith(`.${candidate}`);
}

function findProviderByDomain(domainCandidate) {
  const domain = normalizeDomain(domainCandidate);
  if (!domain) {
    return null;
  }

  return (
    PROVIDERS.find((provider) => provider.domains.some((candidate) => domainMatches(domain, candidate))) || null
  );
}

function findProviderById(providerId) {
  if (!providerId || typeof providerId !== "string") {
    return null;
  }

  const normalized = providerId.trim().toLowerCase();
  return PROVIDERS.find((provider) => provider.id === normalized) || null;
}

function findProviderForUrl(urlCandidate) {
  if (!urlCandidate || typeof urlCandidate !== "string") {
    return null;
  }

  try {
    const host = new URL(urlCandidate).hostname;
    return findProviderByDomain(host);
  } catch (_error) {
    if (_error.message) console.debug("findProviderForUrl error", _error.message);
    return null;
  }
}

async function searchAnime(query, domainCandidate, filters = {}) {
  // --- INTERCEPCIÓN PARA PRÓXIMOS ESTRENOS ---
  if (!query && filters.status === 'upcoming') {
    try {
      const page = filters.page || 1;
      const res = await axios.get(`https://api.jikan.moe/v4/seasons/upcoming?page=${page}&limit=20`);
      if (res.data?.data) {
        const results = res.data.data.map(anime => ({
          id: anime.mal_id,
          title: anime.title,
          slug: anime.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          url: anime.url, // myanimelist URL
          image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
          backdrop: null,
          type: anime.type || "Anime",
          score: anime.score ? String(anime.score) : null,
          status: "Próximamente",
          year: anime.year ? String(anime.year) : null,
        }));
        return {
          success: true,
          data: { query: "upcoming", results, count: results.length },
          source: "jikan",
        };
      }
    } catch (e) {
      console.warn("Fallo interceptor de Jikan para próximos estrenos", e);
    }
  }
  // --- FIN INTERCEPCIÓN ---

  const forcedProvider = findProviderByDomain(domainCandidate) || findProviderById(domainCandidate);
  const providersToTry = forcedProvider ? [forcedProvider] : PROVIDERS;

  let lastEmpty = null;
  const errors = [];

  for (const provider of providersToTry) {
    try {
      const result = await provider.service.searchAnime(query, provider.domains[0], filters);
      const count = result?.data?.count ?? 0;
      if (count > 0 || forcedProvider) {
        return {
          ...result,
          source: result?.source || provider.id,
        };
      }

      if (!lastEmpty) {
        lastEmpty = {
          ...result,
          source: result?.source || provider.id,
        };
      }
    } catch (error) {
      errors.push({ provider: provider.id, error });
    }
  }

  if (lastEmpty) {
    return lastEmpty;
  }

  if (errors.length === providersToTry.length && errors[0]?.error) {
    throw errors[0].error;
  }

  throw new ApiError(502, "No se pudo completar la busqueda en proveedores");
}

async function getJikanData(title) {
  try {
    const cleanTitle = title.replace(/\([^)]*\)/g, "").trim();
    const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanTitle)}&limit=1`, { timeout: 4000 });
    if (res.data?.data?.length > 0) {
      const anime = res.data.data[0];
      let status = null;
      if (anime.status === "Currently Airing") status = "En emisión";
      else if (anime.status === "Finished Airing") status = "Finalizado";
      else if (anime.status === "Not yet aired") status = "Próximamente";
      
      let relationsList = [];
      try {
        const relationsRes = await axios.get(`https://api.jikan.moe/v4/anime/${anime.mal_id}/relations`, { timeout: 4000 });
        if (relationsRes.data?.data) {
          relationsRes.data.data.forEach(relGroup => {
            // Include important relation types
            const validTypes = ["Sequel", "Prequel", "Alternative setting", "Alternative version", "Side story", "Spin-off"];
            if (validTypes.includes(relGroup.relation)) {
              relGroup.entry.forEach(entry => {
                // Only link to other anime
                if (entry.type === "anime") {
                  relationsList.push({
                    relation: relGroup.relation,
                    title: entry.name,
                    malId: entry.mal_id
                  });
                }
              });
            }
          });
        }
      } catch (relError) {
        console.warn(`[Jikan] Error fetching relations for ${anime.mal_id}:`, relError.message);
      }

      return {
        score: anime.score ? String(anime.score) : null,
        status: status,
        year: anime.year ? String(anime.year) : null,
        relations: relationsList
      };
    }
  } catch (e) {
    console.warn(`[Jikan] Error al buscar ${title}:`, e.message);
  }
  return null;
}

async function augmentAnimeData(animeData, provider) {
  if (!animeData?.title) return animeData;
  
  // 1. Intentar obtener datos reales y exactos desde MyAnimeList (Jikan)
  const jikanData = await getJikanData(animeData.title);
  if (jikanData) {
    if (jikanData.score) animeData.score = jikanData.score;
    if (jikanData.status) animeData.status = jikanData.status;
    if (jikanData.year && !animeData.year) animeData.year = jikanData.year;
    if (jikanData.relations && jikanData.relations.length > 0) {
      animeData.relations = jikanData.relations;
    }
  }

  // 2. Si todavía faltan datos o parece sospechoso, consultamos TODAS las demás webs (JKAnime, TioAnime, etc.)
  const currentYear = new Date().getFullYear().toString();
  const needsScore = !animeData.score || animeData.score === '0' || animeData.score === '0.0' || Number.parseFloat(animeData.score) > 10;
  const suspiciousStatus = animeData.status === 'Finalizado' && animeData.year === currentYear;

  const alternativeProviders = PROVIDERS.filter(p => p.id !== provider.id && p.id !== 'animeav1');
  
  for (const altProvider of alternativeProviders) {
    try {
      if (!altProvider.service.searchAnime || !altProvider.service.getAnimeInfo) continue;
      
      const searchRes = await altProvider.service.searchAnime(animeData.title, altProvider.domains[0], { limit: 1 });
      if (searchRes?.data?.animes?.length > 0) {
        const match = searchRes.data.animes[0];
        const altInfo = await altProvider.service.getAnimeInfo(match.url);
        
        if (altInfo?.data) {
           if (needsScore && altInfo.data.score && altInfo.data.score !== '0' && Number.parseFloat(altInfo.data.score) <= 10) {
             animeData.score = altInfo.data.score;
           }
           // Si el actual es finalizado (sospechoso) y otro proveedor dice que está en emisión, confiamos en el otro
           if (suspiciousStatus && altInfo.data.status && altInfo.data.status !== 'Finalizado') {
             animeData.status = altInfo.data.status;
           }
        }
      }
    } catch (crossCheckError) {
      console.warn(`[AugmentData] Fallo cruzado en ${altProvider.id} para ${animeData.title}:`, crossCheckError.message);
    }
  }

  return animeData;
}

async function getAnimeInfo(urlCandidate) {
  let finalUrl = urlCandidate;
  
  // Si la URL viene de MyAnimeList (ej. desde la Cartelera de Jikan), 
  // necesitamos buscarla en nuestros proveedores para obtener la URL real de streaming.
  if (urlCandidate && urlCandidate.includes("myanimelist.net/anime/")) {
     try {
       const malId = urlCandidate.split("/anime/")[1]?.split("/")[0];
       // Usamos Jikan para obtener el título rápido
       const jikanRes = await axios.get(`https://api.jikan.moe/v4/anime/${malId}`);
       if (jikanRes.data?.data?.title) {
          const title = jikanRes.data.data.title;
          const defaultProvider = PROVIDERS[2]; // animeflv
          const searchRes = await defaultProvider.service.searchAnime(title, defaultProvider.domains[0], { limit: 1 });
          if (searchRes?.data?.animes?.length > 0) {
             finalUrl = searchRes.data.animes[0].url;
          }
       }
     } catch (e) {
       console.warn("Fallo al resolver URL de MAL a proveedor local:", e.message);
     }
  }

  const provider = findProviderForUrl(finalUrl) || PROVIDERS[2]; // animeflv fallback
  if (!provider) {
    throw new ApiError(400, "Proveedor no soportado");
  }

  const result = await provider.service.getAnimeInfo(finalUrl);
  
  if (result?.data) {
    result.data = await augmentAnimeData(result.data, provider);
  }

  return {
    ...result,
    source: result?.source || provider.id,
  };
}

async function getEpisodeLinks(urlCandidate, includeMega, excludeServers) {
  const provider = findProviderForUrl(urlCandidate) || PROVIDERS[0];
  if (!provider) {
    throw new ApiError(400, "Proveedor no soportado");
  }

  let result;
  try {
    result = await provider.service.getEpisodeLinks(urlCandidate, includeMega, excludeServers);
  } catch (e) {
    console.warn(`[Fallback] ${provider.id} falló para ${urlCandidate}:`, e.message);
    result = { data: { variants: { SUB: 0, DUB: 0 } } };
  }

  // Cross-provider fallback if no servers found
  if (!result?.data?.variants || (result.data.variants.SUB === 0 && result.data.variants.DUB === 0)) {
    console.warn(`[Fallback] No se encontraron servidores en ${provider.id}. Intentando alternativas...`);
    
    // Extract slug and episode number from the URL candidate
    let slug = "";
    let epNum = "";
    try {
       const parts = new URL(urlCandidate).pathname.split('/').filter(Boolean);
       if (parts[0] === 'ver' || parts[0] === 'episodio' || parts[0] === 'anime') {
           const slugParts = parts[1].split('-');
           // Handle episode number at the end
           if (!isNaN(slugParts[slugParts.length - 1])) {
              epNum = slugParts.pop();
              slug = slugParts.join('-');
           } else {
              slug = parts[1];
           }
       } else {
           // Fallback for jkanime style
           slug = parts[0];
           epNum = parts[1] || "";
       }
    } catch(e) {}
    
    // Sometimes slug on animeflv has "-episodio" attached or similar
    slug = slug.replace(/-episodio$/, '');
    
    if (slug && epNum) {
       const altUrls = [
          { id: 'jkanime', url: `https://jkanime.net/${slug}/${epNum}/` },
          { id: 'tioanime', url: `https://tioanime.com/ver/${slug}-${epNum}` },
          { id: 'animeav1', url: `https://animeav1.com/ver/${slug}-${epNum}` }
       ];
       
       for (const alt of altUrls) {
          if (alt.id === provider.id) continue;
          const altProvider = findProviderById(alt.id);
          if (!altProvider || !altProvider.service.getEpisodeLinks) continue;
          
          try {
             console.log(`[Fallback] Intentando con ${alt.id}: ${alt.url}`);
             const altResult = await altProvider.service.getEpisodeLinks(alt.url, includeMega, excludeServers);
             if (altResult?.data?.variants && (altResult.data.variants.SUB > 0 || altResult.data.variants.DUB > 0)) {
                console.log(`[Fallback] Éxito con ${alt.id}`);
                return {
                   ...altResult,
                   source: `${alt.id} (fallback de ${provider.id})`
                };
             }
          } catch(e) {
             console.warn(`[Fallback] ${alt.id} falló:`, e.message);
          }
       }
    }
  }

  // If all fallbacks fail, or if it succeeded originally, return the result
  if (!result || !result.data) {
     throw new ApiError(500, "No se encontraron servidores en ningún proveedor.");
  }

  return {
    ...result,
    source: result?.source || provider.id,
  };
}

async function getHome(domainCandidate) {
  const provider = findProviderByDomain(domainCandidate) || findProviderById(domainCandidate) || PROVIDERS[2]; // animeflv por defecto
  
  if (provider?.service?.getHome) {
    const res = await provider.service.getHome(provider.domains[0]);
    
    // Augment schedule with Jikan API for currently airing season
    try {
      const jikanRes = await axios.get(`https://api.jikan.moe/v4/seasons/now?limit=16`);
      if (jikanRes.data?.data && jikanRes.data.data.length > 0) {
        const jikanSchedule = jikanRes.data.data.map(anime => ({
          title: anime.title,
          type: anime.type || "Anime",
          url: anime.url, // myanimelist URL (will be handled by our getAnimeInfo fallback)
        }));
        
        // Merge them, prioritizing Jikan for volume but keeping any from FLV that aren't duplicates
        const merged = [...jikanSchedule];
        if (res.data?.schedule) {
          for (const flv of res.data.schedule) {
             if (!merged.some(m => m.title.toLowerCase().includes(flv.title.toLowerCase()) || flv.title.toLowerCase().includes(m.title.toLowerCase()))) {
                merged.push(flv);
             }
          }
        }
        res.data.schedule = merged;
      }
    } catch (e) {
      console.warn("Fallo interceptor de Jikan para schedule", e.message);
    }
    
    return res;
  }
  
  return { success: false, message: "El proveedor no soporta esta función" };
}

module.exports = {
  PROVIDERS,
  searchAnime,
  getAnimeInfo,
  getEpisodeLinks,
  getHome,
};
