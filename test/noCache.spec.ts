import { expect } from '@playwright/test';
import { openHomePage, test } from './fixtures';

test('noCache', async ({ page, cacheRoute, exists }) => {
  cacheRoute.options.noCache = true;
  await cacheRoute.GET('/api/cats');

  await openHomePage(page);

  expect(exists(`localhost/api-cats/GET/headers.json`)).toBe(false);
});
