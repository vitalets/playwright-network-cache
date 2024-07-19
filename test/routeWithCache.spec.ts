import { test, expect } from '@playwright/test';
import { routeWithCache } from '../src';
import { json } from './helpers';

test('routeWithCache', async ({ page }) => {
  await routeWithCache(page, '/api/cats');

  await page.goto('/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`localhost/api-cats/GET/headers.json`)).toHaveProperty('status', 200);
  expect(json(`localhost/api-cats/GET/body.json`)).toHaveProperty('[0].id', 1);
});

test('routeWithCache (custom key)', async ({ page }) => {
  await routeWithCache(page, '/api/cats', {
    cacheKey: (req) => ['custom-key', req.method()],
  });

  await page.goto('/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
  expect(json(`custom-key/GET/headers.json`)).toHaveProperty('status', 200);
});

test('routeWithCache (context)', async ({ page, context }) => {
  await routeWithCache(context, '/api/cats');

  await page.goto('/');

  await expect(page.getByRole('list')).toContainText('Whiskers');
});
