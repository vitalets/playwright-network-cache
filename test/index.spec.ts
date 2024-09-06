import { expect } from '@playwright/test';
import { openHomePage, test } from './fixtures';

test('without options', async ({ page, cacheRoute, json }) => {
  await cacheRoute.GET('/api/cats');

  await openHomePage(page);

  expect(json(`localhost/api-cats/GET/headers.json`)).toHaveProperty('status', 200);
  // note: .toHaveProperty('[0].id', 1) does not work in PW 1.35
  expect(json(`localhost/api-cats/GET/body.json`)[0]).toHaveProperty('id', 1);
});

test('extra dir for request', async ({ page, cacheRoute, exists }) => {
  await cacheRoute.GET('/api/cats', { extraDir: 'foo' });
  await openHomePage(page);

  await cacheRoute.GET('/api/cats', { extraDir: ['bar'] });
  await openHomePage(page);

  expect(exists(`localhost/api-cats/GET/foo/headers.json`)).toBe(true);
  expect(exists(`localhost/api-cats/GET/bar/headers.json`)).toBe(true);
});

test('extra dir for test', async ({ page, cacheRoute, json }) => {
  cacheRoute.options.extraDir.push('foo');
  await cacheRoute.GET('/api/cats');

  await openHomePage(page);

  cacheRoute.options.extraDir.push('bar');
  await openHomePage(page);

  expect(json(`localhost/api-cats/GET/foo/headers.json`)).toHaveProperty('status', 200);
  expect(json(`localhost/api-cats/GET/foo/bar/headers.json`)).toHaveProperty('status', 200);
});

test('baseDir', async ({ page, cacheRoute, exists }) => {
  cacheRoute.options.baseDir += '/foo';
  await cacheRoute.GET('/api/cats');

  await openHomePage(page);

  expect(exists(`../foo/localhost/api-cats/GET/headers.json`)).toBe(true);
});

test('modify response (pass options)', async ({ page, cacheRoute }) => {
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

test('re-define route', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats', async (route, response) => {
    const json = await response.json();
    json[0].name = 'Kitty-1';
    await route.fulfill({ json });
  });

  await openHomePage(page);
  await expect(page.getByRole('list')).toContainText('Kitty-1');

  await cacheRoute.GET('/api/cats', async (route, response) => {
    const json = await response.json();
    json[0].name = 'Kitty-2';
    await route.fulfill({ json });
  });

  await openHomePage(page);
  await expect(page.getByRole('list')).toContainText('Kitty-2');
});

test('cache-images', async ({ page, cacheRoute, json, exists }) => {
  await cacheRoute.GET('/api/cats');
  await cacheRoute.GET('/cat*');

  await openHomePage(page);

  expect(json(`localhost/cat1.webp/GET/headers.json`)).toHaveProperty('status', 200);
  expect(exists('localhost/cat1.webp/GET/body.webp')).toBe(true);

  expect(json(`localhost/cat2.png/GET/headers.json`)).toHaveProperty('status', 200);
  expect(exists('localhost/cat2.png/GET/body.png')).toBe(true);
});

test('http status (matched)', async ({ page, cacheRoute, exists }) => {
  await cacheRoute.GET('/api/cats', { httpStatus: 200 });

  await openHomePage(page);

  expect(exists('localhost/api-cats/GET/200/headers.json')).toBe(true);
});

test('http status (not matched, no file saved)', async ({ page, cacheRoute, exists }) => {
  await cacheRoute.GET('/api/cats', { httpStatus: 500 });

  await openHomePage(page);

  expect(exists('localhost/api-cats/GET/500/headers.json')).toBe(false);
});

test('split by request params', async ({ page, cacheRoute, json }) => {
  await cacheRoute.GET('/api/cats*', {
    extraDir: (req) => new URL(req.url()).searchParams.toString(),
  });

  await openHomePage(page);
  await page.evaluate(async () => {
    await fetch('/api/cats?foo=1');
    await fetch('/api/cats?foo=2');
  });

  expect(json(`localhost/api-cats/GET/headers.json`)).toHaveProperty('status', 200);
  expect(json(`localhost/api-cats/GET/foo=1/headers.json`)).toHaveProperty('status', 200);
  expect(json(`localhost/api-cats/GET/foo=2/headers.json`)).toHaveProperty('status', 200);
});
