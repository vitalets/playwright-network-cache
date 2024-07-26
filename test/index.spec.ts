import { test, expect } from '@playwright/test';
import { cacheRoute } from '../src';
import { json } from './helpers';

test('without options', async ({ page }) => {
  await cacheRoute.GET(page, '**/api/cats');

  await page.goto('/no-opts/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`localhost/no-opts-api-cats/GET/headers.json`)).toHaveProperty('status', 200);
  expect(json(`localhost/no-opts-api-cats/GET/body.json`)).toHaveProperty('[0].id', 1);
});

test('subDir', async ({ page }) => {
  await cacheRoute.GET(page, '**/api/cats', { subDir: 'foo' });

  await page.goto('/custom-key/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`localhost/custom-key-api-cats/GET/foo/headers.json`)).toHaveProperty('status', 200);
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
