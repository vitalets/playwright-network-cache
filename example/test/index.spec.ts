import { test, expect } from '@playwright/test';
import { cacheRoute } from '../../src';

test('load cats', async ({ page }) => {
  await cacheRoute.GET(page, '/api/cats**');
  await page.goto('/');
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

test('add cat (success)', async ({ page }) => {
  await cacheRoute.ALL(page, '/api/cats**');

  await page.goto('/');
  await expect(page.getByRole('list')).toContainText('Whiskers');

  cacheRoute.setScope(page, 'after-add-cat');

  await page.getByRole('textbox').fill('Tomas');
  await page.getByRole('button', { name: 'Add Cat' }).click();

  await expect(page.getByRole('list')).toContainText('Tomas');
});

test.only('add cat (error)', async ({ page }) => {
  await cacheRoute.GET(page, '/api/cats**');

  await page.goto('/');
  await expect(page.getByRole('list')).toContainText('Whiskers');

  await cacheRoute.POST(page, '/api/cats**', { status: 400 });

  await page.getByRole('textbox').fill('');
  await page.getByRole('button', { name: 'Add Cat' }).click();

  await expect(page.getByRole('alert')).toContainText('Name is required');
});
