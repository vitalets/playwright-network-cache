# playwright-network-cache
[![lint](https://github.com/vitalets/playwright-network-cache/actions/workflows/lint.yaml/badge.svg)](https://github.com/vitalets/playwright-network-cache/actions/workflows/lint.yaml)
[![test](https://github.com/vitalets/playwright-network-cache/actions/workflows/test.yaml/badge.svg)](https://github.com/vitalets/playwright-network-cache/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/playwright-network-cache)](https://www.npmjs.com/package/playwright-network-cache)
[![license](https://img.shields.io/npm/l/playwright-network-cache)](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)

Speed up your [Playwright](https://playwright.dev/) tests by cache and mock network requests.

**!This project is under development!**

<!-- toc -->

- [Features](#features)
- [Cache structure](#cache-structure)
- [Installation](#installation)
- [Usage](#usage)
  * [Cache request for a single test](#cache-request-for-a-single-test)
  * [Cache request across all tests](#cache-request-across-all-tests)
  * [Store isolated cache for a particular test](#store-isolated-cache-for-a-particular-test)
  * [Store isolated cache for each test](#store-isolated-cache-for-each-test)
  * [Modify cached response](#modify-cached-response)
  * [Disable cache](#disable-cache)
  * [Force cache update](#force-cache-update)
  * [Split cache files by request query params](#split-cache-files-by-request-query-params)
  * [Split cache files by request body](#split-cache-files-by-request-body)
- [Options](#options)
- [Multi-step cache in complex scenarios](#multi-step-cache-in-complex-scenarios)
    + [Approach 1: single cache file](#approach-1-single-cache-file)
    + [Approach 2: checkpoints](#approach-2-checkpoints)
- [Motivation](#motivation)
- [Alternatives](#alternatives)
- [Changelog](#changelog)
    + [0.2.0](#020)
- [Feedback](#feedback)
- [License](#license)

<!-- tocstop -->

## Features

* Cache network requests automatically during test run
* Store responses as a straightforward file structure
* Modify cached responses for test
* Reuse cache between test runs
* Inspect response body as a pretty formatted JSON
* No mess with HAR format, see [motivation](#motivation)

## Cache structure
Example of generated cache structure:
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
1. Define `cacheRoute` fixture using [`test.extend()`](https://playwright.dev/docs/test-fixtures#creating-a-fixture) method:
  ```ts
  // fixtures.ts
  import { test as base } from '@playwright/test';
  import { CacheRoute } from 'playwright-network-cache';

  export const test = base.extend<{ cacheRoute: CacheRoute }>({
    cacheRoute: async ({ page }, use) => {
      await use(new CacheRoute(page, { /* cache options */ }));
    }
  });
  ```

2. Use `cacheRoute` fixture in tests:
  ```ts
  test('test', async ({ page, cacheRoute }) => {
    await cacheRoute.GET('/api/cats');
    // ... all GET requests to /api/cats will be cached
  });
  ```

More examples below.

### Cache request for a single test
Cache GET requests to `/api/cats` in a particular test:
```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats');
  // ...
});
```

All subsequent test runs will re-use cached response. 
To invalidate that cache, delete files or provide special options.

### Cache request across all tests
Define `cacheRoute` as an **auto** fixture:
```ts
// fixtures.ts
import { test as base } from '@playwright/test';
import { CacheRoute } from 'playwright-network-cache';

export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: [async ({ page }, use) => {
    const cacheRoute = new CacheRoute(page);
    await cacheRoute.GET('/api/cats');
    await use(cacheRoute);
  }, { auto: true }]
});
```
Now GET requests to `/api/cats` in all tests will share the same cache.

### Store isolated cache for a particular test
You may want to have a separate cache for particular test.
For that you can utilize `cacheRoute.extraDir` - an array of extra directories to be inserted into the cache path. You can freely transform that array during test.

```ts
test('test', async ({ page, cacheRoute }) => {
  cacheRoute.extraDir.push('custom-test');
  await cacheRoute.GET('/api/cats');
  // ...
});
```
Generated cache structure:
```
.network-cache
└── example.com
    └── api-cats
        └── GET
            └── custom-test
                ├── headers.json
                └── body.json
```

### Store isolated cache for each test
To store cache files in a separate directory for **each test**, 
you can set `extraDir` to `testInfo.title` in a fixture setup:
```ts
// fixtures.ts
import { test as base } from '@playwright/test';
import { CacheRoute } from 'playwright-network-cache';

export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: async ({ page }, use, testInfo) => {
    await use(new CacheRoute(page, {
      extraDir: testInfo.title
    }));
  }
});
```
After running two tests with titles `custom-test-1` `and custom-test-2`,
the generated structure is:
```
.network-cache
└── example.com
    └── api-cats
        └── GET
            ├── custom-test-1
            │   ├── headers.json
            │   └── body.json
            └── custom-test-2
                ├── headers.json
                └── body.json           
```

### Modify cached response
Use `modify` option. It accepts `route` and `response` params, 
so you can get json / text from the response, 
modify it and call [`route.fulfill`](https://playwright.dev/docs/mock#modify-api-responses) with modified data:
```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats', {
    modify: async (route, response) => {
      const json = await response.json();
      json[0].name = 'Kitty-1';
      await route.fulfill({ json });
    }
  });
  // ...
});
```

### Disable cache
To disable cache in a **single test**, set `cacheRoute.options.noCache` to `true`:
```ts
test('test', async ({ page, cacheRoute }) => {
  cacheRoute.options.noCache = true;
  await cacheRoute.GET('/api/cats'); // <- will not cache
  // ...
});
```

To disable cache in **all tests**, set `noCache` option to `true` in the fixture:
```ts
// fixtures.ts
import { test as base } from '@playwright/test';
import { CacheRoute } from 'playwright-network-cache';

export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: async ({ page }, use, testInfo) => {
    await use(new CacheRoute(page, {
      noCache: true
    }));
  }
});
```

> **Note:** When cache is disabled, response is still handled by `modify` functions

### Force cache update
To force updating cache files for a **single test**, set `cacheRoute.options.forceUpdate` to `true`:
```ts
test('test', async ({ page, cacheRoute }) => {
  cacheRoute.options.forceUpdate = true;
  await cacheRoute.GET('/api/cats');
  // ...
});
```

To force updating cache files for **all tests**, set `forceUpdate` option to `true` in the fixture:
```ts
// fixtures.ts
import { test as base } from '@playwright/test';
import { CacheRoute } from 'playwright-network-cache';

export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: async ({ page }, use, testInfo) => {
    await use(new CacheRoute(page, {
      forceUpdate: true
    }));
  }
});
```

### Split cache files by request query params
```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats', {
    extraDir: req => new URL(req.url()).searchParams.toString()
  });
  // ...
});
```
Given the following requests:
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

### Split cache files by request body
```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats', {
    extraDir: req => req.postDataJSON().email
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

## Options
All actual options are described in code.

## Multi-step cache in complex scenarios
For complex scenarios, you may want to have different cache files for the same API call.
*Example:*
Imagine you have a page with a list of 3 cats and buttons to add and remove cats.
You want to test whole end-2-end flow with adding and removing cats.

#### Approach 1: single cache file
You can manage it with a single cache file for `/api/cats` and several `modify` options:
```ts
test('test cats', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats'); // <- returns 3 cats

  // ...load page
  // ...assert there are 3 cats on the page

  await cacheRoute.GET('/api/cats', {
    modify: async (route, response) => {
      const json = await response.json();
      json.push('Cat-4'); // <- emulate 4th cat is added to initial list
      await route.fulfill({ json });
    }
  });

  // ...click add cat button
  // ...assert there are 4 cats on the page

  await cacheRoute.GET('/api/cats', {
    modify: async (route, response) => {
      const json = await response.json();
      json.shift();       // <- emulate 1st cat is removed
      json.push('Cat-4'); // <- emulate 4th cat is added
      await route.fulfill({ json });
    }
  });

  // ...click remove cat button
  // ...assert there are 3 new cats on the page
});
```

#### Approach 2: checkpoints
Alternative approach is to use `extraDir` option for setting *checkpoints* between test steps. Then cache files will be stored in different directories:
```ts
test('test cats', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats'); // <- returns 3 cats

  // ...load page
  // ...assert there are 3 cats on the page

  // store server response in a new sub dir
  cacheRoute.options.extraDir.push('after-add');
  
  // ...click add cat button
  // ...assert there are 4 cats on the page

  cacheRoute.options.extraDir.pop();
  cacheRoute.options.extraDir.push('after-remove');

  // ...click remove cat button
  // ...assert there are 3 new cats on the page
});
```
Generated cache structure:
```
.network-cache
└── example.com
    └── api-cats
        └── POST
            ├── headers.json
            ├── body.json          # <- response with 3 cats
            ├── after-add
            │   ├── headers.json
            │   └── body.json      # <- response with 4 cats
            └── after-remove
                ├── headers.json
                └── body.json      # <- response with new 3 cats 
```

## Motivation
Playwright has built-in [support for HAR format](https://playwright.dev/docs/mock#mocking-with-har-files) to record and replay network requests. 
But when you need more fine-grained control of network, it becomes messy. Check out these issues where people struggle with HAR: 

- [#21405](https://github.com/microsoft/playwright/issues/21405)
- [#30754](https://github.com/microsoft/playwright/issues/30754)
- [#29190](https://github.com/microsoft/playwright/issues/29190)

This library intentionally does not use HAR. Instead, it generates file-based cache structure, giving you full control of what and how is cached.

## Alternatives
Alternatively, you can check the following packages:
* [playwright-intercept](https://github.com/alectrocute/playwright-intercept) - uses Cypress-influenced API
* [playwright-advanced-har](https://github.com/NoamGaash/playwright-advanced-har) - uses HAR format
* [playwright-request-mocker](https://github.com/kousenlsn/playwright-request-mocker) uses HAR format, looks abandoned

## Changelog

#### 0.2.0
* new api released (breaking)

## Feedback
Feel free to share your feedback and suggestions in [issues](https://github.com/vitalets/playwright-network-cache/issues).

## License
[MIT](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)