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

Cache requests to `/api/cats`:
```ts
import { test } from '@playwright/test';
import { withCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await withCache(page, '/api/cats');
  // ...
});
```

Cache requests to `/api/cats` for 1 hour:
```ts
import { test } from '@playwright/test';
import { withCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await withCache(page, '/api/cats', { ttl: 60 });
  // ...
});
```

Cache requests to `/api/cats` and modify response for test:
```js
import { test } from '@playwright/test';
import { withCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await withCache(page, '/api/cats', async (route, response) => {
    const json = await response.json();
    json[0].name = 'Kitty-1';
    await route.fulfill({ json });
  });
  // ...
});
```

Additionally match by request body:
```ts
import { test } from '@playwright/test';
import { withCache } from 'playwright-network-cache';

test('test', async ({ page }) => {
  // ...
  await withCache(page, '/api/cats', { 
    key: req => req.postDataJSON().email
  });
});
```
This will catch request with body:
```
{
  email: 'user1@example.com'
}
```
and generate the following cache structure:
```
.network-cache
└── example.com
    └── api-cats
        └── GET
            ├── user1@example.com
            │   ├── headers.json
            │   └── body.json
            └── user2@example.com
                ├── headers.json
                └── body.json
```

> Default caching prefix is: `hostname` + `pathname` + `method` + `query`.


## Configuration
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

## Alternatives

* [playwright-advanced-har](https://github.com/NoamGaash/playwright-advanced-har) - does the same things but relies on HAR format.
* [playwright-request-mocker](https://github.com/kousenlsn/playwright-request-mocker) uses HAR, looks abandoned.


## Feedback
Feel free to share your feedback and suggestions in [issues](https://github.com/vitalets/playwright-network-cache/issues).

## License
[MIT](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)