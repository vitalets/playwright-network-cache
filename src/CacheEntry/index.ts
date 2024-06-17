/**
 * Cache entry for particular request.
 */
import path from 'node:path';
import { Request, APIResponse } from '@playwright/test';
import { CACHE_DIR, defaultOptions } from '../config';
import { ResponseInfo } from '../types';
import { filenamify, toArray } from '../utils';
import { HeadersFile } from './HeadersFile';
import { BodyFile } from './BodyFile';
import { SyntheticApiResponse } from './SyntheticApiResponse';

type CacheKey = string | string[] | null;

export type CacheOptions = {
  cacheKey?: CacheKey | ((req: Request) => CacheKey);
  ttlMinutes?: number;
};

export class CacheEntry {
  private options: Required<CacheOptions>;
  private dir: string;
  private headersFile: HeadersFile;

  constructor(
    private req: Request,
    options?: CacheOptions,
  ) {
    this.options = Object.assign({}, defaultOptions, options);
    this.dir = this.buildDir();
    this.headersFile = new HeadersFile(this.dir);
  }

  disabled() {
    return !this.dir;
  }

  exists() {
    const headersFileStat = this.headersFile.stat();
    if (this.options.ttlMinutes === -1) return Boolean(headersFileStat);
    const mtimeMs = headersFileStat?.mtimeMs || 0;
    const age = Date.now() - mtimeMs;
    return age < this.options.ttlMinutes * 60 * 1000;
  }

  async getResponse() {
    const responseInfo = await this.headersFile.read();
    const bodyFile = new BodyFile(this.dir, responseInfo);
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
    await new BodyFile(this.dir, responseInfo).save(await response.body());
  }

  private buildDir() {
    const cacheKey = this.buildCacheKey();
    if (!cacheKey) return '';

    const sanitizedCacheKey = cacheKey
      .map((part) => filenamify(part.replace(/^\/+/, '')))
      .filter(Boolean);

    return path.join(CACHE_DIR, ...sanitizedCacheKey);
  }

  private buildCacheKey() {
    const evaluatedKey =
      typeof this.options.cacheKey === 'function'
        ? this.options.cacheKey(this.req)
        : this.options.cacheKey;

    return evaluatedKey ? toArray(evaluatedKey) : null;
  }
}
