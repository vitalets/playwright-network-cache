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

const defaults = {
  baseDir: '.network-cache',
  strategy: 'on' as CacheStrategy,
  modify: async (route: Route, response: APIResponse) => {
    await route.fulfill({ response });
  },
} satisfies CacheOptions;

export function defineNetworkCacheConfig(userConfig?: CacheOptions) {
  return Object.assign(defaults, userConfig);
}

export type ResolvedCacheOptions = ReturnType<typeof resolveCacheOptions>;

export function resolveCacheOptions(cacheOptionsOrFn?: CacheOptions | CacheOptions['modify']) {
  const cacheOptionsUser =
    typeof cacheOptionsOrFn === 'function'
      ? { modify: cacheOptionsOrFn } // prettier-ignore
      : cacheOptionsOrFn;

  return Object.assign({}, defaults, cacheOptionsUser);
}
