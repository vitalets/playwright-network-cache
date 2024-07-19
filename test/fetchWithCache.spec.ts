import { test, expect } from '@playwright/test';
import { fetchWithCache } from '../src';
import type { Cat } from './app/server';
import { json } from './helpers';

test('modify response', async ({ page }) => {
  await page.route('/api/cats', async (route) => {
    const res = await fetchWithCache(route);
    const json: Cat[] = await res.json();
    json[0].name = 'Kitty';
    await route.fulfill({ json });
  });

  await page.goto('/');

  await expect(page.getByRole('list')).toContainText('Kitty');
});

test('custom key', async ({ page }) => {
  await page.route('/api/cats', async (route) => {
    const res = await fetchWithCache(route, null, {
      cacheKey: 'custom-key2',
    });
    const json: Cat[] = await res.json();
    json[0].name = 'Kitty';
    await route.fulfill({ json });
  });

  await page.goto('/');

  await expect(page.getByRole('list')).toContainText('Kitty');
  expect(json(`custom-key2/headers.json`)).toHaveProperty('status', 200);
});

test('fulfill with response', async ({ page }) => {
  await page.route('/api/cats', async (route) => {
    const response = await fetchWithCache(route, null, {
      cacheKey: 'fulfill-with-response',
    });
    await route.fulfill({ response });
  });

  await page.goto('/');
  // second request to get response from cache
  await page.goto('/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
});
