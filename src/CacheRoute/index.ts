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

type UrlPredicate = Parameters<Page['route']>[0];
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'ALL';
type CacheRouteOptionsOrFn = CacheRouteOptions | CacheRouteOptions['modify'];

export class CacheRoute {
  protected checkpointDir = '';

  constructor(
    protected page: Page | BrowserContext,
    public options: CacheRouteOptions = {},
  ) {}

  setCheckpointDir(value: string) {
    this.checkpointDir = value;
  }

  noCache() {
    this.options.noCache = true;
  }

  forceUpdate() {
    this.options.forceUpdate = true;
  }

  setGroupDir(value: string | string[]) {
    this.options.groupDir = value;
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
      await new CacheRouteHandler(route, {
        ...options,
        httpMethod,
        checkpointDir: this.checkpointDir,
      }).handle();
    });
  }

  private resolveOptions(optionsOrFn?: CacheRouteOptionsOrFn) {
    const providedOptions =
      typeof optionsOrFn === 'function' ? { modify: optionsOrFn } : optionsOrFn;
    return Object.assign({}, defaults, this.options, providedOptions);
  }
}
