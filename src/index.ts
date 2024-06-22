import { Page, Route, BrowserContext } from '@playwright/test';
import { RequestOverrides } from './types';
import { CachedResponse, CacheOptions } from './CachedResponse';
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
  const cachedResponse = new CachedResponse(route.request(), cacheOptions);
  const getResponseFromServer = () => route.fetch(overrides || undefined);

  if (CACHE_STRATEGY === 'off' || cachedResponse.disabled()) {
    return getResponseFromServer();
  }

  if (cachedResponse.exists()) {
    return cachedResponse.get();
  }

  const realResponse = await getResponseFromServer();
  // checking cachedResponse.exists() second time,
  // b/c it can be created during fetch by another test
  if (realResponse.ok() && !cachedResponse.exists()) {
    await cachedResponse.save(realResponse);
  }

  return realResponse;
}
