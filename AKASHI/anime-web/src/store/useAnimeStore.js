import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncUserData } from '../services/db';

export const useAnimeStore = create(
  persist(
    (set, get) => ({
      favorites: [],
      history: [],
      user: null,
      
      // Extended Stats
      totalEpisodesWatched: 0,
      dailyActivity: {}, // { 'YYYY-MM-DD': count }
      genreStats: {}, // { 'Action': count }
      
      toggleFavorite: (anime) => {
        set((state) => {
          const isFav = state.favorites.some(f => f.url === anime.url);
          return {
            favorites: isFav 
              ? state.favorites.filter(f => f.url !== anime.url)
              : [anime, ...state.favorites]
          };
        });
        const currentUser = get().user;
        if (currentUser) {
          syncUserData(currentUser.uid, { favorites: get().favorites });
        }
      },
      
      addToHistory: (anime, episode, episodeUrl, currentTime = 0) => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          
          // Track daily activity
          const newDailyActivity = { ...state.dailyActivity };
          newDailyActivity[today] = (newDailyActivity[today] || 0) + 1;
          
          // Track genre stats
          const newGenreStats = { ...state.genreStats };
          if (anime.genres && Array.isArray(anime.genres)) {
            anime.genres.forEach(g => {
              const genreName = typeof g === 'string' ? g : g.name;
              if (genreName) {
                newGenreStats[genreName] = (newGenreStats[genreName] || 0) + 1;
              }
            });
          }

          const newHistory = [
            { ...anime, lastEpisode: episode, lastEpisodeUrl: episodeUrl, currentTime, watchedAt: new Date().toISOString() },
            ...state.history.filter(h => h.url !== anime.url)
          ].slice(0, 50);
          
          return { 
            history: newHistory,
            totalEpisodesWatched: (state.totalEpisodesWatched || 0) + 1,
            dailyActivity: newDailyActivity,
            genreStats: newGenreStats
          };
        });
        
        const state = get();
        if (state.user) {
          syncUserData(state.user.uid, {
            history: state.history,
            totalEpisodesWatched: state.totalEpisodesWatched,
            dailyActivity: state.dailyActivity,
            genreStats: state.genreStats
          });
        }
      },

      updateProgress: (animeUrl, currentTime) => {
        set((state) => {
          const newHistory = state.history.map(h => 
            h.url === animeUrl ? { ...h, currentTime } : h
          );
          return { history: newHistory };
        });
        
        const state = get();
        if (state.user) {
          syncUserData(state.user.uid, { history: state.history });
        }
      },

      clearHistory: () => {
        set({ history: [] });
        const currentUser = get().user;
        if (currentUser) {
          syncUserData(currentUser.uid, { history: [] });
        }
      },
      
      clearAllData: () => set({
        favorites: [],
        history: [],
        totalEpisodesWatched: 0,
        dailyActivity: {},
        genreStats: {}
      }),
      
      loadUserData: (cloudData) => set((state) => {
        // Merge strategy: Cloud data + Guest data
        const mergedFavorites = [...(cloudData.favorites || [])];
        const cloudFavUrls = new Set(mergedFavorites.map(f => f.url));
        
        // Add guest favorites that are not in cloud
        state.favorites.forEach(f => {
          if (!cloudFavUrls.has(f.url)) {
            mergedFavorites.push(f);
          }
        });
        
        // We'll prioritize cloud history, then fill with guest history for uniqueness
        const mergedHistory = [...(cloudData.history || [])];
        const cloudHistoryUrls = new Set(mergedHistory.map(h => h.url));
        
        state.history.forEach(h => {
          if (!cloudHistoryUrls.has(h.url)) {
            mergedHistory.push(h);
          }
        });
        
        // Sort history by watchedAt descending
        mergedHistory.sort((a, b) => new Date(b.watchedAt || 0) - new Date(a.watchedAt || 0));

        // For stats, we take the max of episodes watched to avoid losing progress
        const mergedTotalEps = Math.max(state.totalEpisodesWatched || 0, cloudData.totalEpisodesWatched || 0);

        // Merge daily activity
        const mergedDaily = { ...state.dailyActivity };
        Object.entries(cloudData.dailyActivity || {}).forEach(([date, count]) => {
          mergedDaily[date] = Math.max(mergedDaily[date] || 0, count);
        });

        // Merge genre stats
        const mergedGenres = { ...state.genreStats };
        Object.entries(cloudData.genreStats || {}).forEach(([genre, count]) => {
          mergedGenres[genre] = Math.max(mergedGenres[genre] || 0, count);
        });
        
        return {
          favorites: mergedFavorites,
          history: mergedHistory.slice(0, 50),
          totalEpisodesWatched: mergedTotalEps,
          dailyActivity: mergedDaily,
          genreStats: mergedGenres
        };
      }),
      
      setUser: (user) => set({ user }),
    }),
    {
      name: 'zenkai-anime-storage',
    }
  )
);
