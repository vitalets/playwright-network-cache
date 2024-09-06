import fs from 'node:fs';
import path from 'node:path';
import { test as base, expect, Page } from '@playwright/test';
import { CacheRoute } from '../src';

type Fixtures = {
  cacheRoute: CacheRoute;
  json: (relPath: string) => Record<string, unknown>;
  exists: (relPath: string) => boolean;
  resolve: (relPath: string) => string;
};

export const test = base.extend<Fixtures>({
  cacheRoute: async ({ page }, use, testInfo) => {
    await use(
      new CacheRoute(page, {
        baseDir: `test/.network-cache/${testInfo.title}`,
      }),
    );
  },
  resolve: async ({ cacheRoute }, use) => {
    await use((relPath: string) => {
      return path.join(cacheRoute.options.baseDir, relPath);
    });
  },
  json: async ({ resolve }, use) => {
    await use((relPath: string) => {
      const fullPath = resolve(relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(content);
    });
  },
  exists: async ({ resolve }, use) => {
    await use((relPath: string) => {
      const fullPath = resolve(relPath);
      return fs.existsSync(fullPath);
    });
  },
});

export async function openHomePage(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('list').getByRole('listitem').nth(1)).toBeVisible();
}
