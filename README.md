# playwright-network-cache
[![lint](https://github.com/vitalets/playwright-network-cache/actions/workflows/lint.yaml/badge.svg)](https://github.com/vitalets/playwright-network-cache/actions/workflows/lint.yaml)
[![test](https://github.com/vitalets/playwright-network-cache/actions/workflows/test.yaml/badge.svg)](https://github.com/vitalets/playwright-network-cache/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/playwright-network-cache)](https://www.npmjs.com/package/playwright-network-cache)
[![license](https://img.shields.io/npm/l/playwright-network-cache)](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)

Cache and mock network requests in [Playwright](https://playwright.dev/) tests.

<!-- toc -->

- [Example](#example)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
  * [Cache requests](#cache-requests)
  * [Cache requests for 1 hour](#cache-requests-for-1-hour)
  * [Cache and modify response](#cache-and-modify-response)
  * [Split cache by query](#split-cache-by-query)
  * [Split cache by request body](#split-cache-by-request-body)
- [Configuration](#configuration)
- [API](#api)
- [About HAR](#about-har)
- [Changelog](#changelog)
    + [0.2.0](#020)
- [Feedback](#feedback)
- [License](#license)

<!-- tocstop -->

## Example
Cache GET requests to `/api/cats`:
```ts
import { cacheRoute } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await cacheRoute.GET(page, '/api/cats');
  // ...
});
```

Cache structure:
```
.network-cache
└── example.com
    └── api-cats
        └── GET
            ├── headers.json
            └── body.json
```

## Features

* requests are cached in straightforward files structure
* JSON responses are pretty formatted, you can inspect it for debug
* you can modify cached responses (see [#29190](https://github.com/microsoft/playwright/issues/29190))
* cache is persistent between test-runs, duration is configurable
* no mess with HAR format


## Installation
Install from npm:
```
npm i -D playwright-network-cache
```

## Usage


## Examples

### Cache requests
```ts
import { cacheRoute } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await cacheRoute.GET(page, '/api/cats');
  // ...
});
```

### Cache requests for 1 hour
```ts
import { cacheRoute } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await cacheRoute.GET(page, '/api/cats', { ttl: 60 });
  // ...
});
```

### Cache and modify response
```ts
import { cacheRoute } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await cacheRoute.GET(page, '/api/cats', async (route, response) => {
    const json = await response.json();
    json[0].name = 'Kitty-1';
    await route.fulfill({ json });
  });
  // ...
});
```

### Split cache by query
```ts
import { cacheRoute } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await cacheRoute.GET(page, '/api/cats*', {
    scope: req => new URL(req.url()).searchParams.toString()
  });
  // ...
});
```
Having the following requests:
```
GET /api/cats?foo=1
GET /api/cats?foo=2
```
Cache structure will be:
```
.network-cache
└── example.com
    └── api-cats
        └── GET
            ├── foo=1
            │   ├── headers.json
            │   └── body.json
            └── foo=2
                ├── headers.json
                └── body.json
```

### Split cache by request body
```ts
import { cacheRoute } from 'playwright-network-cache';

test('test', async ({ page }) => {
  await cacheRoute.POST(page, '/api/cats', {
    scope: req => req.postDataJSON().email
  });
  // ...
});
```
Having the following requests:
```
POST -d '{"email":"user1@example.com"}' /api/cats
POST -d '{"email":"user2@example.com"}' /api/cats
```
Cache structure will be:
```
.network-cache
└── example.com
    └── api-cats
        └── POST
            ├── user1@example.com
            │   ├── headers.json
            │   └── body.json
            └── user2@example.com
                ├── headers.json
                └── body.json
```

## Configuration
To use network cache with default options, no configuration is required.

If you want to change the defaults, you can provide it in `playwright.config.js`:
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

## API
tbd

## About HAR
[HAR](https://en.wikipedia.org/wiki/HAR_(file_format)) is not the best format for fine-grained control of network in e2e testing. There are several issues in Playwright repo showing how people struggle with it: [#21405](https://github.com/microsoft/playwright/issues/21405), [#30754](https://github.com/microsoft/playwright/issues/30754), [#29190](https://github.com/microsoft/playwright/issues/29190).

This library intentionally does not use HAR. Instead, it generates straightforward file-based cache structure, giving you full control of what and how is cached.

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