import fs from 'node:fs';
import path from 'node:path';
import { test as base } from '@playwright/test';
import { CacheRoute } from '../src';

type Fixtures = {
  cacheRoute: CacheRoute;
  json: (relPath: string) => Record<string, unknown>;
  exists: (relPath: string) => boolean;
};

export const test = base.extend<Fixtures>({
  cacheRoute: async ({ page }, use, testInfo) => {
    await use(
      new CacheRoute(page, {
        baseDir: `test/.network-cache/${testInfo.title}`,
      }),
    );
  },
  json: async ({ cacheRoute }, use) => {
    await use((relPath: string) => {
      const fullPath = path.join(cacheRoute.options.baseDir!, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(content);
    });
  },
  exists: async ({ cacheRoute }, use) => {
    await use((relPath: string) => {
      const fullPath = path.join(cacheRoute.options.baseDir!, relPath);
      return fs.existsSync(fullPath);
    });
  },
});
