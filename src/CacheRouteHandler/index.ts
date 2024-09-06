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

export class CacheRouteHandler {
  private req: Request;
  private cacheDir: string = '';

  constructor(
    private httpMethod: HttpMethod,
    private route: Route,
    private options: ResolvedCacheRouteOptions,
  ) {
    this.req = route.request();
  }

  async handle() {
    if (!this.isRequestMatched()) {
      await this.route.fallback();
      return;
    }

    this.buildCacheDir();

    const response = this.isCacheHit()
      ? await this.fetchFromCache() // prettier-ignore
      : await this.fetchFromServer();

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

  private isCacheHit() {
    const { noCache, forceUpdate } = this.options;
    return !noCache && !forceUpdate && !this.isExpired();
  }

  private async fetchFromServer() {
    const overrides = toFunction(this.options.overrides)(this.req);
    const response = await this.route.fetch(overrides);

    if (this.shouldSaveResponse(response)) {
      await this.saveResponse(response);
    }

    return response;
  }

  private async fetchFromCache() {
    const responseInfo = await new HeadersFile(this.cacheDir).read();
    const bodyFile = new BodyFile(this.cacheDir, responseInfo);
    const body = await bodyFile.read();
    return new SyntheticApiResponse(responseInfo, body);
  }

  private isExpired() {
    const headersFileStat = new HeadersFile(this.cacheDir).stat();
    if (this.options.ttlMinutes === undefined) return !headersFileStat;
    const lastModified = headersFileStat?.mtimeMs || 0;
    const age = Date.now() - lastModified;
    return age > this.options.ttlMinutes * 60 * 1000;
  }

  private shouldSaveResponse(response: APIResponse) {
    if (this.options.noCache) return false;
    if (this.options.forceUpdate) return true;
    // additionally check this.isExpired(),
    // b/c file can be already created by another worker
    // todo: warn if status is not matched?
    return this.matchHttpStatus(response) && this.isExpired();
  }

  private async saveResponse(response: APIResponse) {
    const responseInfo: ResponseInfo = {
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
    };
    await Promise.all([
      this.saveHeadersFile(responseInfo),
      this.saveBodyFile(responseInfo, response),
    ]);
  }

  private async fulfillRoute(response: APIResponse) {
    const { modify, modifyJson } = this.options;
    if (modify) {
      await modify(this.route, response);
    } else if (modifyJson) {
      const origJson = await response.json();
      const resJson = await modifyJson(origJson);
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

  private async saveHeadersFile(responseInfo: ResponseInfo) {
    await new HeadersFile(this.cacheDir).save(responseInfo);
  }

  private async saveBodyFile(responseInfo: ResponseInfo, response: APIResponse) {
    const bodyFile = new BodyFile(this.cacheDir, responseInfo);
    await bodyFile.save(await response.body());
  }
}
