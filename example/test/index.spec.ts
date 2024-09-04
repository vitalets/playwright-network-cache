import { expect } from '@playwright/test';
import { test } from './fixtures';

test('load cats', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats**');

  await page.goto('/');
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

test('add cat (success)', async ({ page, cacheRoute }) => {
  await cacheRoute.ALL('/api/cats**');

  await page.goto('/');
  await expect(page.getByRole('list')).toContainText('Whiskers');

  cacheRoute.setCheckpointDir('after-add-cat');
  // await cacheRoute.POST('/api/cats**');

  await page.getByRole('textbox').fill('Tomas');
  await page.getByRole('button', { name: 'Add Cat' }).click();

  await expect(page.getByRole('list')).toContainText('Tomas');
});

test('add cat (error)', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats**');

  await page.goto('/');
  await expect(page.getByRole('list')).toContainText('Whiskers');

  await cacheRoute.POST('/api/cats**', { httpStatus: 400 });

  await page.getByRole('textbox').fill('');
  await page.getByRole('button', { name: 'Add Cat' }).click();

  await expect(page.getByRole('alert')).toContainText('Name is required');
});
