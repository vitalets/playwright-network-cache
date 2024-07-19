import { CacheEntryOptions } from './CacheEntry';

type CacheStrategy = 'on' | 'off';

export const CACHE_DIR = process.env.NETWORK_CACHE_DIR || '.network-cache';
export const CACHE_STRATEGY = (process.env.NETWORK_CACHE || 'on') as CacheStrategy;
export const CACHE_TTL = process.env.NETWORK_CACHE_TTL;

export const defaultOptions: CacheEntryOptions = {
  ttl: CACHE_TTL ? Number(CACHE_TTL) : undefined,
};
