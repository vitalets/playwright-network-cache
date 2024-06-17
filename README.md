# playwright-network-cache
Cache network requests for faster [Playwright](https://playwright.dev/) tests.

## Features

* requests are cached in separate files on file-system
* file paths (= cacheKeys) are fully customizable, you control what and how to cache (see [#21405](https://github.com/microsoft/playwright/issues/21405), [#30754](https://github.com/microsoft/playwright/issues/30754))
* modify cached responses as normal ones (see [#29190](https://github.com/microsoft/playwright/issues/29190))
* JSON responses are pretty formatted, you can inspect it for debugging
* cache is persistent between test-runs, duration is configurable 

## Cache structure
Example cache structure of API request to `https://example.com/api-cats`:
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

## Showcase
Performance impact was measured on a simple app located in `example` directory.
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

Subsequent run of tests takes only **2 seconds**:
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