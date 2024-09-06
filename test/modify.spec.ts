import { expect } from '@playwright/test';
import { openHomePage, test } from './fixtures';

test('modify response', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats', {
    modify: async (route, response) => {
      const json = await response.json();
      json[0].name = 'Kitty';
      await route.fulfill({ json });
    },
  });

  await openHomePage(page);
  await expect(page.getByRole('list')).toContainText('Kitty');

  await openHomePage(page);
  await expect(page.getByRole('list')).toContainText('Kitty');
});

test('modifyJson', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats', {
    modifyJson: (json) => {
      json[0].name = 'Kitty';
    },
  });

  await openHomePage(page);
  await expect(page.getByRole('list')).toContainText('Kitty');

  await openHomePage(page);
  await expect(page.getByRole('list')).toContainText('Kitty');
});
