/**
 * Creates function to cache routes with particular http method.
 */
import { Page, Route, BrowserContext, APIResponse } from '@playwright/test';
import { config } from './config';
import { CacheEntry, CacheEntryOptions } from './CacheEntry';

export type CacheRouteOptions = Partial<CacheEntryOptions> & {
  overrides?: Parameters<Route['fetch']>[0];
  modify?: (route: Route, response: APIResponse) => Promise<unknown>;
};

export function cacheRouteFactory(method: string) {
  return async (
    page: Page | BrowserContext,
    url: string,
    optionsOrFn?: CacheRouteOptions | CacheRouteOptions['modify'],
  ) => {
    if (config.disabled) return;

    const matchMethod = (route: Route) => {
      return method === 'ALL' || route.request().method() === method;
    };

    await page.route(url, async (route) => {
      if (!matchMethod(route)) {
        await route.fallback();
        return;
      }

      const options = resolveOptions(optionsOrFn);
      const response = await fetchWithCache(route, options);
      const modify = options.modify || (() => route.fulfill({ response }));
      await modify(route, response);
    });
  };
}

type ResolvedCacheRouteOptions = ReturnType<typeof resolveOptions>;

async function fetchWithCache(route: Route, options: ResolvedCacheRouteOptions) {
  const cacheEntry = new CacheEntry(route.request(), options);

  if (cacheEntry.exists()) {
    return cacheEntry.getResponse();
  }

  const serverResponse = await route.fetch(options.overrides);

  // checking cachedResponse.exists() second time,
  // b/c it can be created during fetch in another test
  if (serverResponse.ok() && !cacheEntry.exists()) {
    await cacheEntry.saveResponse(serverResponse);
  }

  return serverResponse;
}

function resolveOptions(optionsOrFn?: CacheRouteOptions | CacheRouteOptions['modify']) {
  const options = typeof optionsOrFn === 'function' ? { modify: optionsOrFn } : optionsOrFn;
  return Object.assign({}, config, options);
}
