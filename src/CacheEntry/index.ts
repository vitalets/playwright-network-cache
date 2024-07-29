/**
 * Cache entry for particular request.
 */
import path from 'node:path';
import { Request, APIResponse } from '@playwright/test';
import { filenamify, stripLeadingSlash, toArray } from '../utils';
import { HeadersFile, ResponseInfo } from './HeadersFile';
import { BodyFile } from './BodyFile';
import { SyntheticApiResponse } from './SyntheticApiResponse';
import { config } from '../config';

type CacheSuffix = string | string[] | null | undefined;
type CacheSuffixFn = (req: Request) => CacheSuffix;

export type CacheEntryOptions = {
  /* Additional directory in whole cache dir */
  suffix?: CacheSuffix | CacheSuffixFn;
  /* HTTP response status to be cached */
  status?: number;
  /* Cache time to live (in minutes) */
  ttl?: number;
};

export type CacheDirFnParams = {
  req: Request;
  hostname: string;
  pathname: string;
  method: string;
  status?: number;
  suffix: string[];
};

export type CacheDirFn = (params: CacheDirFnParams) => (string | number | undefined)[];

export class CacheEntry {
  private cacheDir: string;
  private headersFile: HeadersFile;

  constructor(
    private req: Request,
    private options: CacheEntryOptions,
  ) {
    this.cacheDir = this.buildCacheDir();
    this.headersFile = new HeadersFile(this.cacheDir);
  }

  exists() {
    const headersFileStat = this.headersFile.stat();
    if (this.options.ttl === undefined) return Boolean(headersFileStat);
    const mtimeMs = headersFileStat?.mtimeMs || 0;
    const age = Date.now() - mtimeMs;
    return age < this.options.ttl * 60 * 1000;
  }

  shouldCache(response: APIResponse) {
    return this.matchStatus(response) && !this.exists();
  }

  async getResponse() {
    const responseInfo = await this.headersFile.read();
    const bodyFile = new BodyFile(this.cacheDir, responseInfo);
    const body = await bodyFile.read();
    return new SyntheticApiResponse(responseInfo, body);
  }

  async saveResponse(response: APIResponse) {
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

  private buildCacheDir() {
    const { hostname, pathname } = new URL(this.req.url());
    const params: CacheDirFnParams = {
      req: this.req,
      hostname,
      pathname,
      method: this.req.method(),
      status: this.options.status,
      suffix: this.calcSuffix(),
    };
    const cacheDirFn = config.cacheDirFn || defaultCacheDirFn;

    const dirs = cacheDirFn(params)
      .map((dir) => (dir ? filenamify(stripLeadingSlash(dir.toString())) : ''))
      .filter(Boolean);

    return path.join(config.baseDir, ...dirs);
  }

  private calcSuffix() {
    const { suffix } = this.options;
    const evaluated = typeof suffix === 'function' ? suffix(this.req) : suffix;
    return evaluated ? toArray(evaluated) : [];
  }

  private matchStatus(response: APIResponse) {
    const { status } = this.options;
    return status ? response.status() === status : response.ok();
  }

  private async saveHeadersFile(responseInfo: ResponseInfo) {
    await this.headersFile.save(responseInfo);
  }

  private async saveBodyFile(responseInfo: ResponseInfo, response: APIResponse) {
    const bodyFile = new BodyFile(this.cacheDir, responseInfo);
    await bodyFile.save(await response.body());
  }
}

const defaultCacheDirFn: CacheDirFn = (params) => [
  params.hostname, // prettier-ignore
  params.pathname,
  params.method,
  params.status,
  ...params.suffix,
];
