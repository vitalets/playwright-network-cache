import { test, expect } from '@playwright/test';
import { routeWithCache } from '../../src';

test.beforeEach(async ({ page }) => {
  await routeWithCache(page, '/api/cats');
});

test('test 1', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

test('test 2', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

test('test 3', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Whiskers');
});
