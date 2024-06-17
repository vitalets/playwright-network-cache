# playwright-network-cache
Cache network requests in Playwright tests.

## Features

## Usage
Cache route **without** modifying the response:
```ts
import { test } from '@playwright/test';
import { routeWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await routeWithCache(page, '/api/cats');
  await page.goto('/');
  // ...
});
```

Cache route **with** modifying the response:
```ts
import { test } from '@playwright/test';
import { routeWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await page.route('/api/cats', async (route) => {
    const res = await fetchWithCache(route);
    const json = (await res.json()) as Cat[];
    json[0].name = 'Kitty';
    await route.fulfill({ json });
  });
  await page.goto('/');
  // ...
});
```

Customize caching key:
```ts
import { test } from '@playwright/test';
import { routeWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await routeWithCache(page, '/api/cats', {
    cacheKey: (req) => ['custom-key', req.method()],
  });
  await page.goto('/');
  // ...
});
```

## Performance


## License
[MIT](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)