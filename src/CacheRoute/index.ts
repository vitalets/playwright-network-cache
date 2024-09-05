/**
 * CacheRoute class manages cached routes for the particular page.
 *
 * Note:
 * The name "CacheRoute" does not fully express the behavior,
 * b/c it's not about only single route.
 * But it's very semantic in usage: cacheRoute.GET('/api/cats')
 */

import { BrowserContext, Page, Request } from '@playwright/test';
import { CacheRouteOptions } from './options';
import { defaults } from './defaults';
import { CacheRouteHandler } from '../CacheRouteHandler';
import { toArray } from '../utils';

type UrlPredicate = Parameters<Page['route']>[0];
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'ALL';
type CacheRouteOptionsOrFn = CacheRouteOptions | CacheRouteOptions['modify'];

export class CacheRoute {
  public extraDir: (string | ((req: Request) => string | string[]))[];

  constructor(
    protected page: Page | BrowserContext,
    public options: CacheRouteOptions = {},
  ) {
    this.extraDir = toArray(options.extraDir || []);
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

  private async registerCachedRoute(
    httpMethod: HttpMethod,
    url: UrlPredicate,
    optionsOrFn?: CacheRouteOptionsOrFn,
  ) {
    await this.page.route(url, async (route) => {
      const options = this.resolveOptions(optionsOrFn);
      await new CacheRouteHandler(httpMethod, route, options).handle();
    });
  }

  private resolveOptions(optionsOrFn?: CacheRouteOptionsOrFn) {
    const providedOptions =
      typeof optionsOrFn === 'function' ? { modify: optionsOrFn } : optionsOrFn;

    // extraDir is the only prop that is merged, not overwritten
    const extraDir = providedOptions?.extraDir
      ? this.extraDir.concat(toArray(providedOptions.extraDir))
      : this.extraDir;

    return Object.assign({}, defaults, this.options, providedOptions, { extraDir });
  }
}
