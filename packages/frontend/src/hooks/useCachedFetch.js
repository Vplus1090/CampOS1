import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * getStaleFromCache — like getFromCache but ALWAYS returns cached data
 * even if expired. Used for stale-while-revalidate pattern.
 */
const getStaleFromCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Return data regardless of expiry
    return parsed.data ?? parsed;
  } catch {
    return null;
  }
};

const saveToLocalCache = (key, data, ttlHours = 24) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      expiration: Date.now() + ttlHours * 3600_000,
    }));
  } catch { /* storage full — ignore */ }
};

const isCacheStale = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return true;
    const { expiration } = JSON.parse(raw);
    return !expiration || Date.now() > expiration;
  } catch {
    return true;
  }
};

/**
 * useCachedFetch — stale-while-revalidate hook.
 *
 * 1. Immediately returns cached data (even if expired).
 * 2. Fetches fresh data in the background.
 * 3. Updates state when fresh data arrives.
 * 4. If fetch fails (offline / server down), keeps showing cached data.
 *
 * @param {string}   cacheKey   - localStorage key to use
 * @param {Function} fetcher    - async () => data  (throw on error)
 * @param {object}   options
 * @param {number}   options.ttlHours   - cache TTL in hours (default 24)
 * @param {boolean}  options.enabled    - set false to skip fetch entirely
 * @param {any[]}    options.deps       - extra deps that retrigger the fetch
 */
export function useCachedFetch(cacheKey, fetcher, {
  ttlHours = 24,
  enabled = true,
  deps = [],
} = {}) {
  const stale = getStaleFromCache(cacheKey);

  const [data, setData]           = useState(stale !== null ? stale : undefined);
  const [isLoading, setIsLoading] = useState(!stale); // only show spinner if no cache
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale]     = useState(isCacheStale(cacheKey));
  const [error, setError]         = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Track online/offline
  useEffect(() => {
    const go  = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online',  go);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online',  go);
      window.removeEventListener('offline', off);
    };
  }, []);

  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const revalidate = useCallback(async (silent = false) => {
    if (!enabled) return;
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const fresh = await fetchRef.current();
      if (fresh !== undefined && fresh !== null) {
        setData(fresh);
        saveToLocalCache(cacheKey, fresh, ttlHours);
        setIsStale(false);
      }
    } catch (err) {
      setError(err);
      // Keep showing cached data — do NOT clear state
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ttlHours, enabled]);

  // On mount: load cache synchronously, then revalidate in background
  useEffect(() => {
    if (!enabled) return;
    const cached = getStaleFromCache(cacheKey);
    if (cached !== null) {
      setData(cached);
      setIsLoading(false);
    }
    revalidate(!!cached); // silent if cache exists, loud if not
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled, ...deps]);

  return { data, isLoading, isRefreshing, isStale, error, isOffline, revalidate };
}

export default useCachedFetch;
