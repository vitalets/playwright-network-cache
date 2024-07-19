import { test, expect } from '@playwright/test';
import { withCache } from '../../src';

test('load cats', async ({ page }) => {
  await withCache(page, '/api/cats**');
  await page.goto('/');
  await expect(page.getByRole('list')).toContainText('Whiskers');
});

// test('add cat', async ({ page }) => {
//   // await routeWithCache(page, '/api/cats**');
//   await page.route('/api/cats**', withCache());

//   await withCache(page, '/api/cats**');

//   // await withCache(page, '/api/cats**', { key: 'after-submit' });

//   await withCache(page, '/api/cats**', {
//     // key: 'cats',
//     // overrides: (req) => {}
//     modify: async (res, route) => {
//       const json: Cat[] = await res.json();
//       json[0].name = 'Kitty';
//       await route.fulfill({ json });
//     },
//   });

//   await page.goto('/');
//   await expect(page.getByRole('list')).toContainText('Whiskers');
//   await page.getByRole('textbox').fill('Tomas');
//   await page.route(
//     '/api/cats**',
//     withCache('after-add', async (route, res) => {
//       const json: Cat[] = await res.json();
//       json[0].name = 'Kitty';
//       return {
//         json,
//       };
//     }),
//   );
//   await page.route(
//     '/api/cats**',
//     withCache({
//       cacheSuffix: 'after-add',
//       cacheKey: ['asdfasdf'],
//     }),
//   );
//   await page.route('/api/cats**', async (route) => {
//     const res = await fetchWithCache(route);
//     const json: Cat[] = await res.json();
//     json[0].name = 'Kitty';
//     await route.fulfill({ json });
//   });
//   await page.getByRole('button', { name: 'Add Cat' }).click();
//   await expect(page.getByRole('list')).toContainText('Tomas');
// });
