import { Request } from '@playwright/test';
import { CacheOptions } from './CacheEntry';

type CacheStrategy = 'on' | 'off';

export const CACHE_DIR = process.env.NETWORK_CACHE_DIR || '.network-cache';
export const CACHE_STRATEGY = (process.env.NETWORK_CACHE || 'on') as CacheStrategy;
export const CACHE_TTL = Number(process.env.NETWORK_CACHE_TTL || 60);

export const defaultOptions: Required<CacheOptions> = {
  cacheKey: defaultCacheKey,
  ttlMinutes: CACHE_TTL,
};

function defaultCacheKey(req: Request) {
  const method = req.method();
  const url = new URL(req.url());
  const query = url.searchParams.toString();
  return [
    url.hostname, // prettier-ignore
    url.pathname,
    `${method}${query ? `_${query}` : ''}`,
  ];
}
