

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const animeService = {
  /**
   * Search for animes
   * @param {string} query - The search term
   * @param {string} domain - Optional provider domain
   */
  search: async (query, filters = {}) => {
    try {
      const url = new URL(`${BASE_URL}/anime/search`);
      if (query) url.searchParams.append('q', query);
      
      // Append additional filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) url.searchParams.append(key, filters[key]);
      });
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    } catch (error) {
      console.error('API Error (search):', error);
      throw error;
    }
  },

  /**
   * Get detailed info about an anime
   * @param {string} animeUrl - The provider URL of the anime
   */
  getInfo: async (animeUrl) => {
    try {
      const url = new URL(`${BASE_URL}/anime/info`);
      url.searchParams.append('url', animeUrl);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to get anime info');
      return await response.json();
    } catch (error) {
      console.error('API Error (info):', error);
      throw error;
    }
  },

  /**
   * Get episode video links
   * @param {string} episodeUrl - The provider URL of the episode
   */
  getEpisode: async (episodeUrl) => {
    try {
      const url = new URL(`${BASE_URL}/anime/episode`);
      url.searchParams.append('url', episodeUrl);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to get episode links');
      return await response.json();
    } catch (error) {
      console.error('API Error (episode):', error);
      throw error;
    }
  },

  /**
   * Initiate a download
   * @param {Object} downloadData - { url, quality, variant, preferredServer, includeMega }
   */
  download: async (downloadData) => {
    try {
      const response = await fetch(`${BASE_URL}/anime/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(downloadData),
      });
      if (!response.ok) throw new Error('Download request failed');
      return await response.json();
    } catch (error) {
      console.error('API Error (download):', error);
      throw error;
    }
  },
};
