import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCachedWordList,
  cacheWordList,
  clearWordListCache,
  isWordListCached,
} from '../utils/wordListCache';

describe('wordListCache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('cacheWordList', () => {
    it('caches word list to localStorage', () => {
      const words = ['apple', 'banana', 'crane'];
      cacheWordList(words);

      const cached = localStorage.getItem('crackle_word_list');
      expect(cached).toBeTruthy();

      const parsed = JSON.parse(cached!);
      expect(parsed.words).toEqual(words);
      expect(parsed.version).toBe('1.0');
      expect(parsed.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('sets cache version', () => {
      cacheWordList(['test']);
      const version = localStorage.getItem('crackle_word_list_version');
      expect(version).toBe('1.0');
    });
  });

  describe('getCachedWordList', () => {
    it('returns cached words when valid', () => {
      const words = ['apple', 'banana', 'crane'];
      cacheWordList(words);

      const retrieved = getCachedWordList();
      expect(retrieved).toEqual(words);
    });

    it('returns null when cache is empty', () => {
      const retrieved = getCachedWordList();
      expect(retrieved).toBeNull();
    });

    it('returns null when version mismatch', () => {
      const data = {
        words: ['test'],
        timestamp: Date.now(),
        version: '0.9',
      };
      localStorage.setItem('crackle_word_list', JSON.stringify(data));
      localStorage.setItem('crackle_word_list_version', '0.9');

      const retrieved = getCachedWordList();
      expect(retrieved).toBeNull();
    });

    it('returns null when cache is expired (over 7 days)', () => {
      const EIGHT_DAYS = 8 * 24 * 60 * 60 * 1000;
      const data = {
        words: ['test'],
        timestamp: Date.now() - EIGHT_DAYS,
        version: '1.0',
      };
      localStorage.setItem('crackle_word_list', JSON.stringify(data));
      localStorage.setItem('crackle_word_list_version', '1.0');

      const retrieved = getCachedWordList();
      expect(retrieved).toBeNull();
    });

    it('handles corrupted cache data', () => {
      localStorage.setItem('crackle_word_list', 'invalid json');
      localStorage.setItem('crackle_word_list_version', '1.0');

      const retrieved = getCachedWordList();
      expect(retrieved).toBeNull();
    });
  });

  describe('clearWordListCache', () => {
    it('clears all cache data', () => {
      cacheWordList(['test']);
      expect(localStorage.getItem('crackle_word_list')).toBeTruthy();

      clearWordListCache();
      expect(localStorage.getItem('crackle_word_list')).toBeNull();
      expect(localStorage.getItem('crackle_word_list_version')).toBeNull();
    });
  });

  describe('isWordListCached', () => {
    it('returns true when valid cache exists', () => {
      cacheWordList(['test']);
      expect(isWordListCached()).toBe(true);
    });

    it('returns false when cache is empty', () => {
      expect(isWordListCached()).toBe(false);
    });

    it('returns false when cache is invalid', () => {
      localStorage.setItem('crackle_word_list', 'invalid');
      expect(isWordListCached()).toBe(false);
    });
  });

  describe('cache expiration', () => {
    it('accepts cache within 7 days', () => {
      const SIX_DAYS = 6 * 24 * 60 * 60 * 1000;
      const data = {
        words: ['test'],
        timestamp: Date.now() - SIX_DAYS,
        version: '1.0',
      };
      localStorage.setItem('crackle_word_list', JSON.stringify(data));
      localStorage.setItem('crackle_word_list_version', '1.0');

      const retrieved = getCachedWordList();
      expect(retrieved).toEqual(['test']);
    });
  });
});
