/**
 * Allows to cache network requests to avoid hitting the network on subsequent runs.
 */
import fs from 'fs/promises';
import path from 'node:path';
import { Page, Request, Route } from '@playwright/test';
import { SyntheticApiResponse } from './SyntheticApiResponse';
import { ResponseInfo } from './types';

const CACHE_DIR = '.network-cache';
const TTL_MINUTES = 60;

type RequestOverrides = Parameters<Route['fetch']>[0];

export type RouteCacheOptions = {
  cacheKey?: string | string[] | ((req: Request) => string | string[]);
  ttlMinutes?: number;
};

const defaults: Required<RouteCacheOptions> = {
  cacheKey: buildCacheKey,
  ttlMinutes: TTL_MINUTES,
};

export async function routeWithCache(
  page: Page,
  url: Parameters<Page['route']>[0],
  cacheOptions?: RouteCacheOptions,
) {
  await page.route(url, async (route) => {
    const response = await fetchWithCache(route, undefined, cacheOptions);
    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: await response.body(),
    });
  });
}

export async function fetchWithCache(
  route: Route,
  overrides?: RequestOverrides,
  cacheOptions?: RouteCacheOptions,
) {
  const resolvedOptions = Object.assign({}, defaults, cacheOptions);
  const cacheKeyRaw =
    typeof resolvedOptions.cacheKey === 'function'
      ? resolvedOptions.cacheKey(route.request())
      : resolvedOptions.cacheKey;
  const cacheKey = Array.isArray(cacheKeyRaw) ? cacheKeyRaw : [cacheKeyRaw];
  const cacheDir = buildCacheDir(cacheKey);
  const headersFile = path.join(cacheDir, 'headers.json');
  const headersFileStat = await fs.stat(headersFile).catch(() => {});
  // todo: handle ttl
  if (headersFileStat) {
    // console.log('cache hit', headersFile);
    const responseInfo = JSON.parse(await fs.readFile(headersFile, 'utf8')) as ResponseInfo;
    const bodyFilename = getBodyFilename(responseInfo);
    const bodyFile = path.join(cacheDir, bodyFilename);
    const body = await fs.readFile(bodyFile);
    return new SyntheticApiResponse(responseInfo, body);
  } else {
    // console.log('no cache', route.request().url());
    const response = await route.fetch(overrides);
    if (response.ok()) {
      // save headers
      const responseInfo: ResponseInfo = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
      };
      await fs.mkdir(cacheDir, { recursive: true });
      // todo: check that file is not already exists or updated
      await fs.writeFile(headersFile, prettifyJson(responseInfo));

      // save body
      const bodyFilename = getBodyFilename(responseInfo);
      const bodyFile = path.join(cacheDir, bodyFilename);
      const bodyBuffer = await response.body();
      const body = isJsonResponse(responseInfo)
        ? prettifyJson(bodyBuffer.toString('utf8'))
        : bodyBuffer;
      await fs.writeFile(bodyFile, body);
    }

    return response;
  }
}

function buildCacheKey(req: Request) {
  const method = req.method();
  const url = new URL(req.url());
  const query = url.searchParams.toString();
  return [
    url.hostname, // prettier-ignore
    url.pathname,
    `${method}${query ? `_${query}` : ''}`,
  ];
}

function buildCacheDir(cacheKey: string[]) {
  const sanitizedCacheKey = cacheKey
    .map((part) => part.split('/').filter(Boolean).join('-'))
    .filter(Boolean);
  return path.join(CACHE_DIR, ...sanitizedCacheKey);
}

function isJsonResponse(responseInfo: ResponseInfo) {
  return responseInfo.headers['content-type']?.includes('application/json');
}

function prettifyJson(data: string | Record<string, unknown>) {
  const obj = typeof data === 'string' ? JSON.parse(data) : data;
  return JSON.stringify(obj, null, 2);
}

function getBodyFilename(responseInfo: ResponseInfo) {
  return isJsonResponse(responseInfo) ? 'body.json' : 'body.txt';
}
