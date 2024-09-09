/**
 * Handle caching of particular request route.
 */
import path from 'node:path';
import { APIResponse, Request, Route } from '@playwright/test';
import { filenamify, toArray, toFunction, trimSlash } from '../utils';
import { HeadersFile, ResponseInfo } from './HeadersFile';
import { BodyFile } from './BodyFile';
import { SyntheticApiResponse } from './SyntheticApiResponse';
import { BuildCacheDirArg } from '../CacheRoute/options';
import { HttpMethod, ResolvedCacheRouteOptions } from '../CacheRoute';
import { debug } from '../debug';

export class CacheRouteHandler {
  private req: Request;
  private cacheDir: string = '';
  private lastModified = 0;

  constructor(
    private httpMethod: HttpMethod,
    private route: Route,
    private options: ResolvedCacheRouteOptions,
  ) {
    this.req = route.request();
  }

  // eslint-disable-next-line complexity, max-statements
  async handle() {
    if (!this.isRequestMatched()) {
      await this.route.fallback();
      return;
    }

    const { noCache, forceUpdate } = this.options;

    if (noCache) {
      const response = await this.fetchFromServer();
      await this.fulfillRoute(response);
      return;
    }

    this.buildCacheDir();
    this.storeLastModified();

    const useRealRequest = forceUpdate || this.isExpired();
    const response = useRealRequest
      ? await this.fetchFromServer() // prettier-ignore
      : await this.fetchFromCache();

    if (useRealRequest && this.matchHttpStatus(response)) {
      await this.saveResponse(response);
    }

    await this.fulfillRoute(response);
  }

  private isRequestMatched() {
    return this.isRequestMatchedByMethod() && this.isRequestMatchedByFn();
  }

  private isRequestMatchedByMethod() {
    return this.httpMethod === 'ALL' || this.httpMethod === this.req.method();
  }

  private isRequestMatchedByFn() {
    const matchFn = this.options.match || (() => true);
    return matchFn(this.req);
  }

  private async fetchFromServer() {
    debug(`Fetching from server: ${this.req.method()} ${this.req.url()}`);
    const overrides = toFunction(this.options.overrides)(this.req);
    return this.route.fetch(overrides);
  }

  private async fetchFromCache() {
    debug(`Fetching from cache: ${this.req.method()} ${this.req.url()}`);
    const responseInfo = await new HeadersFile(this.cacheDir).read();
    const bodyFile = new BodyFile(this.cacheDir, responseInfo);
    const body = await bodyFile.read();
    return new SyntheticApiResponse(responseInfo, body);
  }

  private isExpired() {
    if (this.options.ttlMinutes === undefined) return !this.lastModified;
    const age = Date.now() - this.lastModified;
    return age > this.options.ttlMinutes * 60 * 1000;
  }

  private isUpdated() {
    const lastModified = new HeadersFile(this.cacheDir).getLastModified();
    return lastModified > this.lastModified;
  }

  private async saveResponse(response: APIResponse) {
    const responseInfo: ResponseInfo = {
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
    };
    const body = await response.body();
    // file can be updated by another worker
    if (!this.isUpdated()) {
      debug(`Writing cache: ${this.cacheDir}`);
      new HeadersFile(this.cacheDir).save(responseInfo);
      new BodyFile(this.cacheDir, responseInfo).save(body);
    } else {
      debug(`Skip writing cache, updated by another worker: ${this.cacheDir}`);
    }
  }

  private async fulfillRoute(response: APIResponse) {
    const { modify, modifyJSON } = this.options;
    if (modify) {
      await modify(this.route, response);
    } else if (modifyJSON) {
      const origJson = await response.json();
      const resJson = await modifyJSON(origJson);
      await this.route.fulfill({ json: resJson || origJson });
    } else {
      await this.route.fulfill({ response });
    }
  }

  private buildCacheDir() {
    const { hostname, pathname } = new URL(this.req.url());
    const extraDir = toArray(this.options.extraDir || [])
      .map((item) => {
        return toFunction(item)(this.req);
      })
      .flat();

    const ctx: BuildCacheDirArg = {
      hostname,
      pathname,
      httpMethod: this.req.method(),
      extraDir,
      httpStatus: this.options.httpStatus,
      req: this.req,
    };

    const dirs = this.options
      .buildCacheDir(ctx)
      .flat()
      .map((dir) => (dir ? filenamify(trimSlash(dir.toString())) : ''))
      .filter(Boolean);

    this.cacheDir = path.join(this.options.baseDir, ...dirs);
  }

  private matchHttpStatus(response: APIResponse) {
    const { httpStatus } = this.options;
    return httpStatus ? response.status() === httpStatus : response.ok();
  }

  private storeLastModified() {
    this.lastModified = new HeadersFile(this.cacheDir).getLastModified();
  }
}
