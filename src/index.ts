import { Page, Route, APIResponse, BrowserContext } from '@playwright/test';
import { RequestOverrides } from './types';
import { CACHE_STRATEGY } from './config';
import { CacheEntry, CacheEntryOptions } from './CacheEntry';

type ModifyFn = (route: Route, response: APIResponse) => Promise<unknown>;

export type CacheOptions = CacheEntryOptions & {
  overrides?: RequestOverrides;
  modify?: ModifyFn;
};

export async function withCache(
  page: Page | BrowserContext,
  url: Parameters<Page['route']>[0],
  cacheOptionsOrFn?: CacheOptions | ModifyFn,
) {
  const cacheOptions =
    typeof cacheOptionsOrFn === 'function' ? { modify: cacheOptionsOrFn } : cacheOptionsOrFn;

  // todo: check that such route already registered and unregister
  await page.route(url, async (route) => {
    const response = await fetchWithCache(route, cacheOptions);
    const modify = cacheOptions?.modify || defaultModify;
    await modify(route, response);
  });
}

// eslint-disable-next-line complexity
async function fetchWithCache(route: Route, cacheOptions: CacheOptions = {}) {
  const { key, ttl } = cacheOptions;
  const cacheEntry = new CacheEntry(route.request(), { key, ttl });
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

const defaultModify = async (route: Route, response: APIResponse) => {
  await route.fulfill({ response });
};
