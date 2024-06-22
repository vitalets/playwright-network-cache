# playwright-network-cache
[![npm version](https://img.shields.io/npm/v/playwright-network-cache)](https://www.npmjs.com/package/playwright-network-cache)
[![license](https://img.shields.io/npm/l/playwright-network-cache)](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)

Cache network requests for faster [Playwright](https://playwright.dev/) tests.

## Features

* requests are cached in separate files on file-system
* file paths (= cacheKeys) are fully customizable, you control what and how to cache (see [#21405](https://github.com/microsoft/playwright/issues/21405), [#30754](https://github.com/microsoft/playwright/issues/30754))
* modify cached responses as normal ones (see [#29190](https://github.com/microsoft/playwright/issues/29190))
* JSON responses are pretty formatted, you can inspect it for debugging
* cache is persistent between test-runs, duration is configurable 

## Cache structure
Example of cache directory structure for GET request `https://example.com/api-cats`:
```
.network-cache
└── example.com
    └── api-cats
        └── GET
            ├── headers.json
            └── body.json
```
## Installation
Install from npm:
```
npm i -D playwright-network-cache
```

## Usage
For caching route **without** modifying the response use `routeWithCache`:
```ts
import { test } from '@playwright/test';
import { routeWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await routeWithCache(page, '/api/cats');
  await page.goto('/');
  // ...
});
```
You can fully customize cacheKey - array of strings that will produce cache  directory for that request:
```ts
import { test } from '@playwright/test';
import { routeWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await routeWithCache(page, '/api/cats', {
    cacheKey: (req) => ['some-prefix', req.method()],
  });
  await page.goto('/');
  // ...
});
```
> By default cacheKey is: `hostname` + `pathname` + `method` + `query`. See [implementation](https://github.com/vitalets/playwright-network-cache/blob/main/src/config.ts#L15).

To cache route **with** modifying the response use `fetchWithCache` (that is similar to `route.fetch`):
```ts
import { test } from '@playwright/test';
import { fetchWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await page.route('/api/cats', async (route) => {
    const res = await fetchWithCache(route);
    const json: Cat[] = await res.json();
    json[0].name = 'Kitty';
    await route.fulfill({ json });
  });
  await page.goto('/');
  // ...
});
```
You can also customize cacheKey:
```ts
import { test } from '@playwright/test';
import { fetchWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await page.route('/api/cats', async (route) => {
    const res = await fetchWithCache(route, null, {
      cacheKey: (req) => ['some-prefix', req.method()],
    });
    const json: Cat[] = await res.json();
    json[0].name = 'Kitty';
    await route.fulfill({ json });
  });
  await page.goto('/');
  // ...
});
```

#### Cache expiration
By default responses are cached forever, until you manually delete cache files.
You can cache this behavior by providing `ttlMinutes` option to specific request,
or setting `NETWORK_CACHE_TTL` globally.

Set cache expiration delay for 1 hour for specific request:
```ts
await routeWithCache(page, '/api/cats', {
  ttlMinutes: 60
});
```
Set cache expiration delay **globally** for all responses:
```ts
// playwright.config.ts

process.env.NETWORK_CACHE_TTL = '60';

export default defineConfig({
  // ...
});
```

## Showcase
Performance impact was measured on a simple app provided in `example` directory.
Adding `playwright-network-cache` reduced test time from **10 seconds** to **2 seconds**. 

The app is a single web-page that requests data from server. Server responds with 2 seconds delay. 

There are 3 tests emulating check of different scenarios.

Running tests without cache takes about **10 seconds**:
```
Running 3 tests using 1 worker

  ✓  1 index.spec.ts:8:5 › test 1 (3.3s)
  ✓  2 index.spec.ts:14:5 › test 2 (3.0s)
  ✓  3 index.spec.ts:20:5 › test 3 (3.0s)

  3 passed (11.2s)
```

When `playwright-network-cache` is enabled, on the first run it takes **5 seconds** (because first request goes to server to initialize cache):
```
Running 3 tests using 1 worker

  ✓  1 index.spec.ts:8:5 › test 1 (3.0s)
  ✓  2 index.spec.ts:14:5 › test 2 (97ms)
  ✓  3 index.spec.ts:20:5 › test 3 (200ms)

  3 passed (5.1s)
```

Subsequent run of tests takes only **2 seconds**, because all requests are served from cache:
```
Running 3 tests using 1 worker

  ✓  1 index.spec.ts:8:5 › test 1 (170ms)
  ✓  2 index.spec.ts:14:5 › test 2 (98ms)
  ✓  3 index.spec.ts:20:5 › test 3 (97ms)

  3 passed (2.1s)
```

## Alternatives
There is alternative package [playwright-advanced-har](https://github.com/NoamGaash/playwright-advanced-har) that does many the same things but relies on HAR format.

## Feedback
Feel free to share your feedback and suggestions in [issues](https://github.com/vitalets/playwright-network-cache/issues).

## License
[MIT](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)