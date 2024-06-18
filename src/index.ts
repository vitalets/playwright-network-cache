import { Page, Route, BrowserContext } from '@playwright/test';
import { RequestOverrides } from './types';
import { CacheEntry, CacheOptions } from './CacheEntry';
import { CACHE_STRATEGY } from './config';

export { CacheOptions };

export async function routeWithCache(
  page: Page | BrowserContext,
  url: Parameters<Page['route']>[0],
  cacheOptions?: CacheOptions,
) {
  await page.route(url, async (route) => {
    const response = await fetchWithCache(route, null, cacheOptions);
    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: await response.body(),
    });
  });
}

// eslint-disable-next-line complexity
export async function fetchWithCache(
  route: Route,
  overrides?: RequestOverrides | null,
  cacheOptions?: CacheOptions,
) {
  const cacheEntry = new CacheEntry(route.request(), cacheOptions);
  const getResponseFromServer = () => route.fetch(overrides || undefined);

  if (CACHE_STRATEGY === 'off' || cacheEntry.disabled()) {
    return getResponseFromServer();
  }

  if (cacheEntry.exists()) {
    return cacheEntry.getResponse();
  }

  const response = await getResponseFromServer();
  // checking cache second time, b/c it can be created during fetch
  if (response.ok() && !cacheEntry.exists()) {
    await cacheEntry.saveResponse(response);
  }

  return response;
}
