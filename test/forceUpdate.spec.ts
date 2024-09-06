import fs from 'node:fs';
import { expect } from '@playwright/test';
import { openHomePage, test } from './fixtures';

test('forceUpdate', async ({ page, cacheRoute, resolve }) => {
  await cacheRoute.GET('/api/cats');
  const getStat = () => fs.statSync(resolve(`localhost/api-cats/GET/headers.json`));

  await openHomePage(page);
  const stat1 = getStat();

  await openHomePage(page);
  const stat2 = getStat();

  cacheRoute.options.forceUpdate = true;

  await openHomePage(page);
  const stat3 = getStat();

  expect(stat1.mtime).toEqual(stat2.mtime);
  expect(stat2.mtime).not.toEqual(stat3.mtime);
});
