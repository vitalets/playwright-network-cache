import { test, expect } from '@playwright/test';
import { routeWithCache, fetchWithCache } from '../src';
import type { Cat } from './server';

test('routeWithCache', async ({ page }) => {
  await page.goto('/');
  await routeWithCache(page, '/api/cats');
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

test('routeWithCache (custom key)', async ({ page }) => {
  await page.goto('/');
  await routeWithCache(page, '/api/cats', {
    cacheKey: (req) => ['custom-key', req.method()],
  });
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

test('fetchWithCache', async ({ page }) => {
  await page.goto('/');
  await page.route('/api/cats', async (route) => {
    const res = await fetchWithCache(route);
    const json = (await res.json()) as Cat[];
    json[0].name = 'Kitty';
    await route.fulfill({ json });
  });
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Kitty');
});

test('fetchWithCache (custom key)', async ({ page }) => {
  await page.goto('/');
  await page.route('/api/cats', async (route) => {
    const res = await fetchWithCache(route, null, {
      cacheKey: 'cats',
    });
    const json = (await res.json()) as Cat[];
    json[0].name = 'Kitty';
    await route.fulfill({ json });
  });
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Kitty');
});
