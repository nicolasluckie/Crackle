/**
 * Word list caching utility
 * Stores the word list in localStorage to avoid repeated downloads
 */

const CACHE_KEY = 'crackle_word_list';
const CACHE_VERSION_KEY = 'crackle_word_list_version';
const CACHE_VERSION = '1.0'; // Increment this to invalidate cache

interface CachedWordList {
  words: string[];
  timestamp: number;
  version: string;
}

/**
 * Get cached word list if available and valid
 */
export function getCachedWordList(): string[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);

    if (!cached || cachedVersion !== CACHE_VERSION) {
      // Cache is invalid or version mismatch
      clearWordListCache();
      return null;
    }

    const data: CachedWordList = JSON.parse(cached);

    // Optional: Add expiration check (e.g., 7 days)
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > ONE_WEEK) {
      clearWordListCache();
      return null;
    }

    return data.words;
  } catch (error) {
    console.error('Error reading cached word list:', error);
    clearWordListCache();
    return null;
  }
}

/**
 * Cache the word list
 */
export function cacheWordList(words: string[]): void {
  try {
    const data: CachedWordList = {
      words,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
  } catch (error) {
    console.error('Error caching word list:', error);
    // If storage is full or quota exceeded, clear cache
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearWordListCache();
    }
  }
}

/**
 * Clear the cached word list
 */
export function clearWordListCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_VERSION_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Check if word list is cached
 */
export function isWordListCached(): boolean {
  return getCachedWordList() !== null;
}
