import { Page, Route, APIResponse, BrowserContext } from '@playwright/test';
import { RequestOverrides } from './types';
import { CACHE_STRATEGY } from './config';
import { CacheEntry, CacheEntryOptions } from './CacheEntry';

export type CacheOptions = CacheEntryOptions & {
  overrides?: RequestOverrides;
  modify?: typeof defaultModify;
};

export async function withCache(
  page: Page | BrowserContext,
  url: Parameters<Page['route']>[0],
  cacheOptions?: CacheOptions,
) {
  // todo: check that such route already registered and unregister
  await page.route(url, async (route) => {
    const response = await fetchWithCache(route, cacheOptions);
    const modify = cacheOptions?.modify || defaultModify;
    await modify(route, response);
  });
}

// eslint-disable-next-line complexity
async function fetchWithCache(route: Route, cacheOptions: CacheOptions = {}) {
  const { key, fullKey, ttl } = cacheOptions;
  const cacheEntry = new CacheEntry(route.request(), { key, fullKey, ttl });
  const getResponseFromServer = () => route.fetch(cacheOptions.overrides);

  if (CACHE_STRATEGY === 'off') {
    return getResponseFromServer();
  }

  if (cacheEntry.exists()) {
    return cacheEntry.getResponse();
  }

  const serverResponse = await getResponseFromServer();
  // checking cachedResponse.exists() second time,
  // b/c it can be created during fetch by another test
  if (serverResponse.ok() && !cacheEntry.exists()) {
    await cacheEntry.saveResponse(serverResponse);
  }

  return serverResponse;
}

async function defaultModify(route: Route, response: APIResponse) {
  await route.fulfill({ response });
}
