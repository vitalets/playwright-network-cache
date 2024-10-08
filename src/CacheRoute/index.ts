/**
 * CacheRoute class manages cached routes for the particular page.
 *
 * Note:
 * The name "CacheRoute" does not fully express the behavior,
 * b/c it's not about only single route.
 * But it's very semantic in usage: cacheRoute.GET('/api/cats')
 */

import { BrowserContext, Page } from '@playwright/test';
import { CacheRouteOptions } from './options';
import { defaults } from './defaults';
import { CacheRouteHandler } from '../CacheRouteHandler';
import { toArray } from '../utils';

type UrlPredicate = Parameters<Page['route']>[0];
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'ALL';
type CacheRouteOptionsOrFn = CacheRouteOptions | CacheRouteOptions['modify'];
export type ResolvedCacheRouteOptions = ReturnType<CacheRoute['resolveConstructorOptions']>;

export class CacheRoute {
  public options: ResolvedCacheRouteOptions;

  constructor(
    protected page: Page | BrowserContext,
    options: CacheRouteOptions = {},
  ) {
    this.options = this.resolveConstructorOptions(options);
  }

  async GET(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.registerCachedRoute('GET', url, optionsOrFn);
  }

  async POST(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.registerCachedRoute('POST', url, optionsOrFn);
  }

  async PUT(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.registerCachedRoute('PUT', url, optionsOrFn);
  }

  async PATCH(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.registerCachedRoute('PATCH', url, optionsOrFn);
  }

  async DELETE(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.registerCachedRoute('DELETE', url, optionsOrFn);
  }

  async HEAD(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.registerCachedRoute('HEAD', url, optionsOrFn);
  }

  async ALL(url: UrlPredicate, optionsOrFn?: CacheRouteOptionsOrFn) {
    await this.registerCachedRoute('ALL', url, optionsOrFn);
  }

  protected async registerCachedRoute(
    httpMethod: HttpMethod,
    url: UrlPredicate,
    optionsOrFn?: CacheRouteOptionsOrFn,
  ) {
    await this.page.route(url, async (route) => {
      const options = this.resolveMethodOptions(optionsOrFn);
      try {
        await new CacheRouteHandler(httpMethod, route, options).handle();
      } catch (e) {
        // ignore errors -> page can be already closed as route is not used in test
        if (await this.isPageClosed()) return;
        throw e;
      }
    });
  }

  protected resolveConstructorOptions(options: CacheRouteOptions) {
    const extraDir = options.extraDir ? toArray(options.extraDir) : [];
    return { ...defaults, ...options, extraDir };
  }

  protected resolveMethodOptions(optionsOrFn: CacheRouteOptionsOrFn = {}) {
    const methodOptions = typeof optionsOrFn === 'function' ? { modify: optionsOrFn } : optionsOrFn;

    // extraDir is the only prop that is merged, not overwritten
    const extraDir = this.options.extraDir.slice();
    if (methodOptions.extraDir) {
      extraDir.push(...toArray(methodOptions.extraDir));
    }

    return { ...this.options, ...methodOptions, extraDir };
  }

  protected async isPageClosed() {
    return 'isClosed' in this.page ? this.page.isClosed() : !this.page?.pages().length;
  }
}
