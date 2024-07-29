import { test, expect } from '@playwright/test';
import { cacheRoute } from '../src';
import { json, expectFileExists } from './helpers';

test('without options', async ({ page }) => {
  await cacheRoute.GET(page, '**/api/cats');

  await page.goto('/no-opts/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`localhost/no-opts-api-cats/GET/headers.json`)).toHaveProperty('status', 200);
  // note: .toHaveProperty('[0].id', 1) does not work in PW 1.35
  expect(json(`localhost/no-opts-api-cats/GET/body.json`)[0]).toHaveProperty('id', 1);
});

test('scope', async ({ page }) => {
  await cacheRoute.GET(page, '**/api/cats', { scope: 'foo' });

  await page.goto('/custom-scope/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`localhost/custom-scope-api-cats/GET/foo/headers.json`)).toHaveProperty(
    'status',
    200,
  );
});

test('setScope', async ({ page }) => {
  cacheRoute.setScope(page, 'my-scope');
  await cacheRoute.GET(page, '**/api/cats');

  await page.goto('/set-scope/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`localhost/set-scope-api-cats/GET/my-scope/headers.json`)).toHaveProperty(
    'status',
    200,
  );
});

test('modify response (pass options)', async ({ page }) => {
  await cacheRoute.GET(page, '**/api/cats', {
    modify: async (route, response) => {
      const json = await response.json();
      json[0].name = 'Kitty';
      await route.fulfill({ json });
    },
  });

  await page.goto('/modify-via-opts/');
  await expect(page.getByRole('list')).toContainText('Kitty');

  await page.goto('/modify-via-opts/');
  await expect(page.getByRole('list')).toContainText('Kitty');
});

test('modify response (pass function)', async ({ page }) => {
  await cacheRoute.GET(page, '**/api/cats', async (route, response) => {
    const json = await response.json();
    json[0].name = 'Kitty';
    await route.fulfill({ json });
  });

  await page.goto('/modify-via-fn/');
  await expect(page.getByRole('list')).toContainText('Kitty');

  await page.goto('/modify-via-fn/');
  await expect(page.getByRole('list')).toContainText('Kitty');
});

test('re-define route', async ({ page }) => {
  await cacheRoute.GET(page, '**/api/cats', async (route, response) => {
    const json = await response.json();
    json[0].name = 'Kitty-1';
    await route.fulfill({ json });
  });

  await page.goto('/re-define/');
  await expect(page.getByRole('list')).toContainText('Kitty-1');

  await cacheRoute.GET(page, '**/api/cats', async (route, response) => {
    const json = await response.json();
    json[0].name = 'Kitty-2';
    await route.fulfill({ json });
  });

  await page.goto('/re-define/');
  await expect(page.getByRole('list')).toContainText('Kitty-2');
});

test('apply to context', async ({ page, context }) => {
  await cacheRoute.GET(context, '**/api/cats');

  await page.goto('/context/');
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

test('cache-images', async ({ page }) => {
  await cacheRoute.GET(page, '**/api/cats');
  await cacheRoute.GET(page, '/cat*');

  await page.goto('/');

  expect(json(`localhost/cat1.webp/GET/headers.json`)).toHaveProperty('status', 200);
  expectFileExists('localhost/cat1.webp/GET/body.webp');

  expect(json(`localhost/cat2.png/GET/headers.json`)).toHaveProperty('status', 200);
  expectFileExists('localhost/cat2.png/GET/body.png');
});

test('status', async ({ page }) => {
  await cacheRoute.GET(page, '**/api/cats', { status: 200 });

  await page.goto('/custom-status/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
  expectFileExists('localhost/custom-status-api-cats/GET/200/headers.json');
});
