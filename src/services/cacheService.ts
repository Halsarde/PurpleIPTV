const CACHE_PREFIX = 'purple_iptv_cache_';
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  timestamp: number;
  data: T;
}

export const cacheService = {
  get: <T>(key: string): T | null => {
    const itemStr = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!itemStr) {
      return null;
    }
    try {
      const item: CacheItem<T> = JSON.parse(itemStr);
      const now = Date.now();
      if (now - item.timestamp > CACHE_EXPIRATION_MS) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }
      return item.data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  },

  set: <T>(key: string, data: T): void => {
    const item: CacheItem<T> = {
      timestamp: Date.now(),
      data,
    };
    try {
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  },

  clear: (key: string): void => {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  },

  clearAll: (): void => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
};
