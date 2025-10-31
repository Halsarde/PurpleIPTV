export const cacheService = {
  set(key: string, data: any, ttl = 1000 * 60 * 60) {
    localStorage.setItem(
      key,
      JSON.stringify({ data, expiry: Date.now() + ttl })
    );
  },
  get<T>(key: string): T | null {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, expiry } = JSON.parse(cached);
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  },
};
