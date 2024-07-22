import { Page, Route, APIResponse, BrowserContext } from '@playwright/test';
import { CACHE_DIR, CACHE_STRATEGY, defaults } from './defaults';
import { CacheEntry, CacheEntryOptions } from './CacheEntry';

type ModifyFn = (route: Route, response: APIResponse) => Promise<unknown>;
type RequestOverrides = Parameters<Route['fetch']>[0];

export type CacheOptions = CacheEntryOptions & {
  overrides?: RequestOverrides;
  modify?: ModifyFn;
};

export async function withCache(
  page: Page | BrowserContext,
  url: Parameters<Page['route']>[0],
  cacheOptionsOrFn?: CacheOptions | ModifyFn,
) {
  const cacheOptions = buildCacheOptions(cacheOptionsOrFn);

  await page.route(url, async (route) => {
    const response = await fetchWithCache(route, cacheOptions);
    await cacheOptions.modify(route, response);
  });
}

// eslint-disable-next-line complexity
async function fetchWithCache(route: Route, cacheOptions: CacheOptions) {
  const { key, ttl } = cacheOptions;
  const cacheEntry = new CacheEntry(CACHE_DIR, route.request(), { key, ttl });
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

function buildCacheOptions(cacheOptionsOrFn?: CacheOptions | ModifyFn) {
  const cacheOptionsUser =
    typeof cacheOptionsOrFn === 'function' ? { modify: cacheOptionsOrFn } : cacheOptionsOrFn;

  return Object.assign({}, defaults, cacheOptionsUser);
}
