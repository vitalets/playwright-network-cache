/**
 * Handle caching of particular request route.
 */
import path from 'node:path';
import { APIResponse, Request, Route } from '@playwright/test';
import { filenamify, toFunction, trimSlash } from '../utils';
import { HeadersFile, ResponseInfo } from './HeadersFile';
import { BodyFile } from './BodyFile';
import { SyntheticApiResponse } from './SyntheticApiResponse';
import { BuildCacheDirArg, ResolvedCacheRouteOptions } from '../CacheRoute/options';
import { HttpMethod } from '../CacheRoute';

type CacheRouteHandlerOptions = ResolvedCacheRouteOptions & {
  httpMethod: HttpMethod;
  checkpointDir: string;
};

export class CacheRouteHandler {
  private req: Request;
  private cacheDir: string;
  private headersFile: HeadersFile;

  constructor(
    private route: Route,
    private options: CacheRouteHandlerOptions,
  ) {
    this.req = route.request();
    this.cacheDir = this.buildCacheDir();
    this.headersFile = new HeadersFile(this.cacheDir);
  }

  async handle() {
    if (!this.isRequestMatched()) {
      await this.route.fallback();
      return;
    }

    const response = this.isCacheHit() ? await this.fetchFromCache() : await this.fetchFromServer();

    await this.fulfillRoute(response);
  }

  private isRequestMatched() {
    return this.isRequestMatchedByMethod() && this.isRequestMatchedByFn();
  }

  private isRequestMatchedByMethod() {
    const { httpMethod } = this.options;
    return httpMethod === 'ALL' || httpMethod === this.req.method();
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
    const responseInfo = await this.headersFile.read();
    const bodyFile = new BodyFile(this.cacheDir, responseInfo);
    const body = await bodyFile.read();
    return new SyntheticApiResponse(responseInfo, body);
  }

  private isExpired() {
    const headersFileStat = this.headersFile.stat();
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
    const modify = this.options.modify || (() => this.route.fulfill({ response }));
    await modify(this.route, response);
  }

  private buildCacheDir() {
    const { hostname, pathname } = new URL(this.req.url());
    const ctx: BuildCacheDirArg = {
      hostname,
      pathname,
      httpMethod: this.req.method(),
      groupDir: this.options.groupDir,
      checkpointDir: this.options.checkpointDir,
      httpStatus: this.options.httpStatus,
      appendDir: toFunction(this.options.appendDir)(this.req),
      req: this.req,
    };

    const dirs = this.options
      .buildCacheDir(ctx)
      .flat()
      .map((dir) => (dir ? filenamify(trimSlash(dir.toString())) : ''))
      .filter(Boolean);

    return path.join(this.options.baseDir, ...dirs);
  }

  private matchHttpStatus(response: APIResponse) {
    const { httpStatus } = this.options;
    return httpStatus ? response.status() === httpStatus : response.ok();
  }

  private async saveHeadersFile(responseInfo: ResponseInfo) {
    await this.headersFile.save(responseInfo);
  }

  private async saveBodyFile(responseInfo: ResponseInfo, response: APIResponse) {
    const bodyFile = new BodyFile(this.cacheDir, responseInfo);
    await bodyFile.save(await response.body());
  }
}
