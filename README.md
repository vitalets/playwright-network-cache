# playwright-network-cache
[![npm version](https://img.shields.io/npm/v/playwright-network-cache)](https://www.npmjs.com/package/playwright-network-cache)
[![license](https://img.shields.io/npm/l/playwright-network-cache)](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)

Cache network requests in [Playwright](https://playwright.dev/) tests.

<!-- toc -->

- [Features](#features)
- [Cache structure](#cache-structure)
- [Installation](#installation)
- [Usage](#usage)
  * [Without response modification](#without-response-modification)
  * [With response modification](#with-response-modification)
- [Cache expiration](#cache-expiration)
- [Showcase](#showcase)
- [Alternatives](#alternatives)
- [Feedback](#feedback)
- [License](#license)

<!-- tocstop -->

## Features

* requests are cached in separate files on file-system
* file path (= cacheKey) is fully customizable, you control what and how to cache (see [#21405](https://github.com/microsoft/playwright/issues/21405), [#30754](https://github.com/microsoft/playwright/issues/30754))
* you can modify cached responses (see [#29190](https://github.com/microsoft/playwright/issues/29190))
* JSON responses are pretty formatted, you can inspect it for debug
* cache is persistent between test-runs, duration is configurable
* does not use HAR format

## Cache structure
Example of cache structure created for GET request to `https://example.com/api-cats`:
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

### Without response modification
To cache route without modifying the response use `routeWithCache`:
```ts
import { test } from '@playwright/test';
import { routeWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await routeWithCache(page, '/api/cats');
  // ...
});
```
You can customize `cacheKey` - array of strings that will produce cache  directory for that request:
```ts
import { test } from '@playwright/test';
import { routeWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await routeWithCache(page, '/api/cats', {
    cacheKey: (req) => ['some-prefix', req.method()],
  });
  // ...
});
```
> By default cacheKey is: `hostname` + `pathname` + `method` + `query`. See [implementation](https://github.com/vitalets/playwright-network-cache/blob/main/src/config.ts#L15).

### With response modification
To cache route with modifying the response, use `fetchWithCache()` function. It is similar to [`route.fetch`](https://playwright.dev/docs/api/class-route#route-fetch)):
```ts
import { test } from '@playwright/test';
import { fetchWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await page.route('/api/cats', async (route) => {
    const res = await fetchWithCache(route); // <- fetch response from cache / from server
    const json: Cat[] = await res.json();
    json[0].name = 'Kitty'; // <- modify response
    await route.fulfill({ json });
  });
  // ...
});
```
You can also customize `cacheKey`:
```ts
import { test } from '@playwright/test';
import { fetchWithCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await page.route('/api/cats', async (route) => {
    const res = await fetchWithCache(route, null, {
      cacheKey: (req) => ['some-prefix', req.method()],
    });
    const json: Cat[] = await res.json();
    json[0].name = 'Kitty'; // <- modify response
    await route.fulfill({ json });
  });
  // ...
});
```

## Cache expiration
By default responses are cached forever, until you manually delete cache files.
You can change this behavior by providing `ttlMinutes` option for specific request,
or setting `NETWORK_CACHE_TTL` globally.

Set cache expiration delay for 1 hour for specific request:
```ts
await routeWithCache(page, '/api/cats', {
  ttlMinutes: 60
});
```
Set cache expiration delay **globally** for all requests:
```ts
// playwright.config.ts

process.env.NETWORK_CACHE_TTL = '60';

export default defineConfig({
  // ...
});
```

## Showcase
Performance impact was measured on a simple app located in `example` directory.
Adding `playwright-network-cache` reduced test time from **10 seconds** to **2 seconds**. 

The app is a single web-page that requests data from server. Server responds with synthetic 2 seconds delay. 

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

* [playwright-advanced-har](https://github.com/NoamGaash/playwright-advanced-har) - does the same things but relies on HAR format.
* [playwright-request-mocker](https://github.com/kousenlsn/playwright-request-mocker) uses HAR, looks abandoned.


## Feedback
Feel free to share your feedback and suggestions in [issues](https://github.com/vitalets/playwright-network-cache/issues).

## License
[MIT](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)