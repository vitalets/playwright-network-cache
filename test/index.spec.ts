import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { routeWithCache, fetchWithCache } from '../src';
import type { Cat } from './server';

const cacheDir = process.env.NETWORK_CACHE_DIR;

test('routeWithCache', async ({ page }) => {
  await page.goto('/');
  await routeWithCache(page, '/api/cats');
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`${cacheDir}/localhost/api-cats/GET/headers.json`)).toHaveProperty('status', 200);
  expect(json(`${cacheDir}/localhost/api-cats/GET/body.json`)).toHaveProperty('[0].id', 1);
});

test('routeWithCache (custom key)', async ({ page }) => {
  await page.goto('/');
  await routeWithCache(page, '/api/cats', {
    cacheKey: (req) => ['custom-key', req.method()],
  });
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`${cacheDir}/custom-key/GET/headers.json`)).toHaveProperty('status', 200);
});

test('routeWithCache (context)', async ({ page, context }) => {
  await page.goto('/');
  await routeWithCache(context, '/api/cats');
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

test('fetchWithCache', async ({ page }) => {
  await page.goto('/');
  await page.route('/api/cats', async (route) => {
    const res = await fetchWithCache(route);
    const json: Cat[] = await res.json();
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
      cacheKey: 'custom-key2',
    });
    const json: Cat[] = await res.json();
    json[0].name = 'Kitty';
    await route.fulfill({ json });
  });
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Kitty');
  expect(json(`${cacheDir}/custom-key2/headers.json`)).toHaveProperty('status', 200);
});

function json(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
