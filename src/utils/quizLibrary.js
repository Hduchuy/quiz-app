/**
 * Quiz Library - Fetching and Caching
 * 
 * Handles loading quiz index, manifests, and quiz content
 * with localStorage caching for performance
 */

// Cache keys
const CACHE_PREFIX = 'quiz_library_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached data from localStorage
 */
function getCached(key) {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Set cached data in localStorage
 */
function setCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to cache data:', e);
    // If storage is full, clear old cache
    clearExpiredCache();
  }
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    for (const key of keys) {
      if (!key.startsWith(CACHE_PREFIX)) continue;

      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          if (now - timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

/**
 * Load quiz library index
 */
export async function loadLibraryIndex() {
  // Try cache first
  const cached = getCached('index');
  if (cached) {
    return cached;
  }

  // Fetch from server
  const response = await fetchWithTimeout('/quizzes/index.json');
  if (!response.ok) {
    throw new Error(`Failed to load library index: ${response.status}`);
  }

  const data = await response.json();
  setCache('index', data);
  return data;
}

/**
 * Load subject manifest
 */
export async function loadSubjectManifest(manifestUrl) {
  // Create cache key from URL
  const cacheKey = `manifest_${manifestUrl}`;

  // Try cache first
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from server
  const response = await fetchWithTimeout(manifestUrl);
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.status}`);
  }

  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}

/**
 * Load quiz content (raw text) - simplified with no caching
 */
export async function loadQuizContent(quizUrl) {
  try {
    const response = await fetch(quizUrl, {
      method: 'GET',
      headers: { 'Accept': 'text/plain' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();

    if (!text || text.length === 0) {
      throw new Error('Empty response');
    }

    return text;
  } catch (e) {
    console.error('[loadQuizContent] Error:', e);
    throw e;
  }
}

/**
 * Clear all quiz library cache
 */
export function clearLibraryCache() {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  try {
    const keys = Object.keys(localStorage);
    const libraryKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    return {
      total: libraryKeys.length,
      keys: libraryKeys.map(k => k.replace(CACHE_PREFIX, ''))
    };
  } catch {
    return { total: 0, keys: [] };
  }
}
