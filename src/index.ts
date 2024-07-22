import { Page, Route, BrowserContext } from '@playwright/test';
import { CacheOptions, resolveCacheOptions, ResolvedCacheOptions, defaults } from './options';
import { CacheEntry } from './CacheEntry';

export { defaults, CacheOptions };

export async function withCache(
  page: Page | BrowserContext,
  url: Parameters<Page['route']>[0],
  cacheOptionsOrFn?: CacheOptions | CacheOptions['modify'],
) {
  const cacheOptions = resolveCacheOptions(cacheOptionsOrFn);

  await page.route(url, async (route) => {
    const response = await fetchWithCache(route, cacheOptions);
    await cacheOptions.modify(route, response);
  });
}

// eslint-disable-next-line complexity
async function fetchWithCache(route: Route, cacheOptions: ResolvedCacheOptions) {
  const { baseDir, key, ttl } = cacheOptions;
  const cacheEntry = new CacheEntry(route.request(), { baseDir, key, ttl });
  const getResponseFromServer = () => route.fetch(cacheOptions.overrides);

  if (cacheOptions.strategy === 'off') {
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
