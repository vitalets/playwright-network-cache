import { Route, APIResponse } from '@playwright/test';
import { CacheEntryOptions } from './CacheEntry';

type CacheStrategy = 'on' | 'off';
type ModifyFn = (route: Route, response: APIResponse) => Promise<unknown>;
type RequestOverrides = Parameters<Route['fetch']>[0];

export type CacheOptions = Partial<CacheEntryOptions> & {
  strategy?: CacheStrategy;
  overrides?: RequestOverrides;
  modify?: ModifyFn;
};

export const defaults = {
  baseDir: process.env.NETWORK_CACHE_DIR || '.network-cache',
  strategy: (process.env.NETWORK_CACHE || 'on') as CacheStrategy,
  ttl: toNumber(process.env.NETWORK_CACHE_TTL),
  modify: async (route: Route, response: APIResponse) => {
    await route.fulfill({ response });
  },
} satisfies CacheOptions;

export type ResolvedCacheOptions = ReturnType<typeof resolveCacheOptions>;

export function resolveCacheOptions(cacheOptionsOrFn?: CacheOptions | CacheOptions['modify']) {
  const cacheOptionsUser =
    typeof cacheOptionsOrFn === 'function'
      ? { modify: cacheOptionsOrFn } // prettier-ignore
      : cacheOptionsOrFn;

  return Object.assign({}, defaults, cacheOptionsUser);
}

function toNumber(value?: string) {
  return value ? Number(value) : undefined;
}
