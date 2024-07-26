import { test, expect } from '@playwright/test';
import { cacheRoute } from '../../src';

test('load cats', async ({ page }) => {
  await cacheRoute.GET(page, '/api/cats**');
  await page.goto('/');
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

test('add cat', async ({ page }) => {
  await cacheRoute.GET(page, '/api/cats**');

  await page.goto('/');
  await expect(page.getByRole('list')).toContainText('Whiskers');

  // cacheRoute.setSubDir(page, 'add-cat');

  await cacheRoute.POST(page, '/api/cats**');
  await cacheRoute.GET(page, '/api/cats**', { subDir: 'add-cat' });

  await page.getByRole('textbox').fill('Tomas');
  await page.getByRole('button', { name: 'Add Cat' }).click();

  await expect(page.getByRole('list')).toContainText('Tomas');
});
