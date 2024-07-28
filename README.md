# playwright-network-cache
[![lint](https://github.com/vitalets/playwright-network-cache/actions/workflows/lint.yaml/badge.svg)](https://github.com/vitalets/playwright-network-cache/actions/workflows/lint.yaml)
[![test](https://github.com/vitalets/playwright-network-cache/actions/workflows/test.yaml/badge.svg)](https://github.com/vitalets/playwright-network-cache/actions/workflows/test.yaml)
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

* requests are cached in straightforward files structure
* JSON responses are pretty formatted, you can inspect it for debug
* you can modify cached responses (see [#29190](https://github.com/microsoft/playwright/issues/29190))
* cache is persistent between test-runs, duration is configurable
* no mess with HAR format

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

Modify cached response:
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

Match by request body:
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
Caching options can be changed in Playwright config:
```ts
import { defineConfig } from '@playwright/test';
import { defineNetworkCacheConfig } from 'playwright-network-cache';

export const cacheConfig = defineNetworkCacheConfig({
  baseDir: 'test/.network-cache',
  ttl: 60,
});

export default defineConfig({
  // ...
});
```

## About HAR
In my opinion, [HAR](https://en.wikipedia.org/wiki/HAR_(file_format)) is not the best format for fine-grained control of network in e2e testing. There are several issues in Playwright repo showing how people struggle with it: [#21405](https://github.com/microsoft/playwright/issues/21405), [#30754](https://github.com/microsoft/playwright/issues/30754), [#29190](https://github.com/microsoft/playwright/issues/29190).

This library intentionally does not use HAR. Instead, it generates simple file-based cache structure, giving you full control of what and how is cached.

Alternatively, you can check the following HAR-based libraries:
* [playwright-advanced-har](https://github.com/NoamGaash/playwright-advanced-har) - does the same things but relies on HAR format.
* [playwright-request-mocker](https://github.com/kousenlsn/playwright-request-mocker) uses HAR, looks abandoned.

## Changelog

#### 0.2.0
* new api released (breaking)

## Feedback
Feel free to share your feedback and suggestions in [issues](https://github.com/vitalets/playwright-network-cache/issues).

## License
[MIT](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)