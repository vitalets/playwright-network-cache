import { test as base } from '@playwright/test';
import { CacheRoute } from '../../src';

export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: async ({ page }, use) => {
    await use(new CacheRoute(page));
  },
});
