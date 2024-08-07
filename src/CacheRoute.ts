/**
 * CacheRoute class manages cached routes in particular page.
 * The name "CacheRoute" not fully express the behavior,
 * but it's very semantic in usage: cacheRoute.GET('/api/cats')
 */

import { APIResponse, BrowserContext, Page, Route } from '@playwright/test';
import { config } from './config';
import { fetchWithCache, FetchWithCacheOptions } from './fetchWithCache';

export type CacheRouteOptions = Partial<FetchWithCacheOptions> & {
  modify?: (route: Route, response: APIResponse) => Promise<unknown>;
};

export type CacheRouteOptionsOrFn = CacheRouteOptions | CacheRouteOptions['modify'];

type UrlPredicate = Parameters<Page['route']>[0];

export class CacheRoute {
  private suffix = '';

  constructor(private page: Page | BrowserContext) {}

  setSuffix(value: string) {
    this.suffix = value;
  }

  async GET(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.createCachedRoute('GET', url, optionsOrFn);
  }

  async POST(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.createCachedRoute('POST', url, optionsOrFn);
  }

  async PUT(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.createCachedRoute('PUT', url, optionsOrFn);
  }

  async PATCH(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.createCachedRoute('PATCH', url, optionsOrFn);
  }

  async DELETE(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.createCachedRoute('DELETE', url, optionsOrFn);
  }

  async HEAD(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.createCachedRoute('HEAD', url, optionsOrFn);
  }

  async ALL(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.createCachedRoute('ALL', url, optionsOrFn);
  }

  private async createCachedRoute(
    method: string,
    url: UrlPredicate,
    optionsOrFn?: CacheRouteOptionsOrFn,
  ) {
    if (config.disabled) return;

    const matchMethod = (route: Route) => {
      return method === 'ALL' || route.request().method() === method;
    };

    await this.page.route(url, async (route) => {
      if (!matchMethod(route)) {
        await route.fallback();
        return;
      }

      const options = this.resolveOptions(optionsOrFn);
      const response = await fetchWithCache(route, options);
      const modify = options.modify || (() => route.fulfill({ response }));
      await modify(route, response);
    });
  }

  private resolveOptions(optionsOrFn?: CacheRouteOptionsOrFn) {
    const options = typeof optionsOrFn === 'function' ? { modify: optionsOrFn } : optionsOrFn;

    // todo: merge scope? (wait user feedback)

    return Object.assign({ suffix: this.suffix }, config, options);
  }
}
