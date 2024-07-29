/**
 * route.fetch() with cache.
 */
import { Route } from '@playwright/test';
import { CacheEntry, CacheEntryOptions } from './CacheEntry';

export type FetchWithCacheOptions = CacheEntryOptions & {
  overrides?: Parameters<Route['fetch']>[0];
};

export async function fetchWithCache(route: Route, options: FetchWithCacheOptions) {
  const cacheEntry = new CacheEntry(route.request(), options);

  if (cacheEntry.exists()) {
    return cacheEntry.getResponse();
  }

  const serverResponse = await route.fetch(options.overrides);

  if (cacheEntry.shouldCache(serverResponse)) {
    await cacheEntry.saveResponse(serverResponse);
  }

  return serverResponse;
}
