import { Route, APIResponse } from '@playwright/test';
import { CacheOptions } from '.';

type CacheStrategy = 'on' | 'off';

export const CACHE_DIR = process.env.NETWORK_CACHE_DIR || '.network-cache';
export const CACHE_STRATEGY = (process.env.NETWORK_CACHE || 'on') as CacheStrategy;
export const CACHE_TTL = process.env.NETWORK_CACHE_TTL;

export const defaults = {
  key: '',
  ttl: CACHE_TTL ? Number(CACHE_TTL) : undefined,
  modify: async (route: Route, response: APIResponse) => {
    await route.fulfill({ response });
  },
} satisfies CacheOptions;
