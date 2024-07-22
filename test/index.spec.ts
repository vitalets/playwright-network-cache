import { test, expect } from '@playwright/test';
import { withCache } from '../src';
import { json } from './helpers';
import { Cat } from './app/server';

test('without options', async ({ page }) => {
  await withCache(page, '**/api/cats');

  await page.goto('/no-opts/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`localhost/no-opts-api-cats/GET/headers.json`)).toHaveProperty('status', 200);
  expect(json(`localhost/no-opts-api-cats/GET/body.json`)).toHaveProperty('[0].id', 1);
});

test('custom key', async ({ page }) => {
  await withCache(page, '**/api/cats', { key: 'foo' });

  await page.goto('/custom-key/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`localhost/custom-key-api-cats/GET/foo/headers.json`)).toHaveProperty('status', 200);
});

test('apply to context', async ({ page, context }) => {
  await withCache(context, '**/api/cats');

  await page.goto('/context/');
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

test('modify response', async ({ page }) => {
  await withCache(page, '**/api/cats', {
    modify: async (route, res) => {
      const json: Cat[] = await res.json();
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
  await withCache(page, '**/api/cats', async (route, res) => {
    const json: Cat[] = await res.json();
    json[0].name = 'Kitty';
    await route.fulfill({ json });
  });

  await page.goto('/modify-via-fn/');
  await expect(page.getByRole('list')).toContainText('Kitty');

  await page.goto('/modify-via-fn/');
  await expect(page.getByRole('list')).toContainText('Kitty');
});
