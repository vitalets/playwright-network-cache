import { test, expect } from '@playwright/test';
import { routeWithCache } from '../src';

test('routeWithCache', async ({ page }) => {
  await page.goto('/');
  await routeWithCache(page, '/api/cats');
  await page.getByRole('button', { name: 'Fetch Cats' }).click();
  await expect(page.getByRole('list')).toContainText('Whiskers');
});
