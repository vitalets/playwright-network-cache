/**
 * Global CacheRoute instance.
 */
import { Page, BrowserContext } from '@playwright/test';
import { CacheRoute } from './CacheRoute';

const cacheRouteMap = new WeakMap<Page | BrowserContext, CacheRoute>();

export const cacheRoute = {
  GET: proxyMethod('GET'),
  POST: proxyMethod('POST'),
  PUT: proxyMethod('PUT'),
  PATCH: proxyMethod('PATCH'),
  DELETE: proxyMethod('DELETE'),
  HEAD: proxyMethod('HEAD'),
  ALL: proxyMethod('ALL'),
  setSuffix: proxyMethod('setSuffix'),
};

function proxyMethod<T extends keyof CacheRoute>(method: T) {
  return (page: Page | BrowserContext, ...args: Parameters<CacheRoute[T]>) => {
    const cacheRoute = getOrCreateCacheRoute(page);
    // @ts-expect-error A spread argument must either have a tuple type or be passed to a rest parameter
    return cacheRoute[method](...args);
  };
}

function getOrCreateCacheRoute(page: Page | BrowserContext) {
  let cacheRoute = cacheRouteMap.get(page);
  if (!cacheRoute) {
    cacheRoute = new CacheRoute(page);
    cacheRouteMap.set(page, cacheRoute);
  }

  return cacheRoute;
}
