/**
 * Cache entry for particular request.
 */
import path from 'node:path';
import { Request, APIResponse } from '@playwright/test';
import { filenamify, toArray } from '../utils';
import { HeadersFile, ResponseInfo } from './HeadersFile';
import { BodyFile } from './BodyFile';
import { SyntheticApiResponse } from './SyntheticApiResponse';

type CacheKey = string | string[] | null;
type CacheKeyFn = (req: Request) => CacheKey;

export type CacheEntryOptions = {
  baseDir: string;
  key?: CacheKey | CacheKeyFn;
  ttl?: number;
};

export class CacheEntry {
  private cacheKey: string[];
  private cacheDir: string;
  private headersFile: HeadersFile;

  constructor(
    private req: Request,
    private options: CacheEntryOptions,
  ) {
    this.cacheKey = this.buildCacheKey();
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
    await this.headersFile.save(responseInfo);
    await new BodyFile(this.cacheDir, responseInfo).save(await response.body());
  }

  private buildCacheDir() {
    const sanitizedCacheKey = this.cacheKey
      .map((part) => filenamify(part.replace(/^\/+/, '')))
      .filter(Boolean);

    if (!sanitizedCacheKey.length) {
      throw new Error(`Empty cache key after filenamify: ${this.cacheKey}`);
    }

    return path.join(this.options.baseDir, ...sanitizedCacheKey);
  }

  private buildCacheKey() {
    const defaultKey = this.getDefaultKey();
    const userKey = this.getOrEvaluateKey(this.options.key);

    return defaultKey.concat(userKey);
  }

  private getDefaultKey() {
    const method = this.req.method();
    const url = new URL(this.req.url());
    const query = url.searchParams.toString();
    return [
      url.hostname, // prettier-ignore
      url.pathname,
      `${method}${query ? `_${query}` : ''}`,
    ];
  }

  private getOrEvaluateKey(key?: CacheKey | CacheKeyFn) {
    const value = typeof key === 'function' ? key(this.req) : key;
    return value ? toArray(value) : [];
  }
}
