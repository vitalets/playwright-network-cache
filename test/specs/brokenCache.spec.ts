import fs from 'node:fs';
import { expect } from '@playwright/test';
import { openHomePage, test } from '../fixtures';

// See: https://github.com/vitalets/playwright-network-cache/issues/10
test('re-fetch broken headers.json', async ({ page, cacheRoute, json, resolve }) => {
  await cacheRoute.GET('/api/cats');
  await openHomePage(page);

  const headersPath = resolve(`localhost/api-cats/GET/headers.json`);
  fs.appendFileSync(headersPath, 'xxxx"\n  }\n}');

  await openHomePage(page);

  expect(json(`localhost/api-cats/GET/headers.json`)).toHaveProperty('status', 200);
});

test('re-fetch missing body', async ({ page, cacheRoute, exists, resolve }) => {
  await cacheRoute.GET('/api/cats');
  await openHomePage(page);

  fs.rmSync(resolve(`localhost/api-cats/GET/body.json`));

  await openHomePage(page);

  expect(exists(`localhost/api-cats/GET/body.json`)).toBe(true);
});

test('no temp files left after write', async ({ page, cacheRoute, resolve }) => {
  await cacheRoute.GET('/api/cats');
  await openHomePage(page);

  const files = fs.readdirSync(resolve(`localhost/api-cats/GET`));
  expect(files.sort()).toEqual(['body.json', 'headers.json']);
});
