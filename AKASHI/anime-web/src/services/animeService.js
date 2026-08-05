import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const CATALOG_DOMAIN = 'animeflv.net';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Premium Feel: Add a micro-delay to let Skeleton animations shine
api.interceptors.response.use(async (response) => {
  await new Promise(resolve => setTimeout(resolve, 350));
  return response;
});

/** Converts an anime image URL to go through our backend proxy to avoid CORS/Hotlinking */
export const proxyImage = (url) => {
  if (!url) return null;
  // If it's already a data URI or relative path, return as-is
  if (url.startsWith('data:') || url.startsWith('/')) return url;
  
  // Proxy these domains to bypass restrictions
  const domainsToProxy = ['animeflv.net', 'animeav1.com', 'shinanime.com', 'cloudinary.com'];
  const shouldProxy = domainsToProxy.some(d => url.includes(d));

  if (shouldProxy) {
    return `${BASE_URL}/anime/image?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export const animeService = {
  getHomeData: async () => {
    const { data } = await api.get('/anime/home');
    return data.data;
  },

  getTrending: async () => {
    const { data } = await api.get('/anime/search', {
      params: { domain: CATALOG_DOMAIN, order: 'rating' }
    });
    return data.data.results || [];
  },

  getCurrentSeason: async () => {
    const { data } = await api.get('/anime/search', {
      params: { domain: CATALOG_DOMAIN, status: 'on_air', order: 'rating' }
    });
    return data.data.results || [];
  },

  getAnimeById: async (animeUrl) => {
    const { data } = await api.get('/anime/info', {
      params: { url: animeUrl }
    });
    return data.data;
  },

  searchAnime: async (query, filters = {}) => {
    const { data } = await api.get('/anime/search', {
      params: { q: query, limit: 20, ...filters }
    });
    return data.data.results || [];
  },

  getEpisode: async (episodeUrl) => {
    const { data } = await api.get('/anime/episode', {
      params: { url: episodeUrl }
    });
    return data.data;
  },

  getCatalog: async (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value && value !== 'default')
    );

    const { data } = await api.get('/anime/search', {
      params: { domain: CATALOG_DOMAIN, limit: 20, ...params }
    });
    return data.data.results || [];
  }
};
