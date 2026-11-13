import fs from 'node:fs';
import { expect } from '@playwright/test';
import { openHomePage, test } from '../fixtures';

// See: https://github.com/vitalets/playwright-network-cache/issues/10
test('no temp files left after write', async ({ page, cacheRoute, resolve }) => {
  await cacheRoute.GET('/api/cats');
  await openHomePage(page);

  const files = fs.readdirSync(resolve(`localhost/api-cats/GET`));
  expect(files.sort()).toEqual(['body.json', 'headers.json']);
});
