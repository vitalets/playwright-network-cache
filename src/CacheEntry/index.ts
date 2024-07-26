/**
 * Cache entry for particular request.
 */
import path from 'node:path';
import { Request, APIResponse } from '@playwright/test';
import { filenamify, stripLeadingSlash, toArray } from '../utils';
import { HeadersFile, ResponseInfo } from './HeadersFile';
import { BodyFile } from './BodyFile';
import { SyntheticApiResponse } from './SyntheticApiResponse';

type SubDir = string | string[] | null | undefined;
type SubDirFn = (req: Request) => SubDir;

export type CacheEntryOptions = {
  baseDir: string;
  subDir?: SubDir | SubDirFn;
  ttl?: number;
};

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
    const url = new URL(this.req.url());
    const dirs = [
      url.hostname, // prettier-ignore
      url.pathname,
      this.req.method(),
      ...this.getSubDirs(),
    ]
      .map((dir) => filenamify(stripLeadingSlash(dir)))
      .filter(Boolean);

    return path.join(this.options.baseDir, ...dirs);
  }

  private getSubDirs() {
    const { subDir } = this.options;
    const evaluated = typeof subDir === 'function' ? subDir(this.req) : subDir;
    return evaluated ? toArray(evaluated) : [];
  }
}
