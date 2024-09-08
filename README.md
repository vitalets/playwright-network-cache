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
- [Examples](#examples)
  * [Cache request for a single test](#cache-request-for-a-single-test)
  * [Cache request for all tests](#cache-request-for-all-tests)
  * [Modify cached response](#modify-cached-response)
  * [Disable cache](#disable-cache)
  * [Force cache update](#force-cache-update)
  * [Match by request fields](#match-by-request-fields)
  * [Match by response HTTP status](#match-by-response-http-status)
  * [Separation of cache files](#separation-of-cache-files)
  * [Split cache files by request query / body](#split-cache-files-by-request-query--body)
- [Multi-step cache in complex scenarios](#multi-step-cache-in-complex-scenarios)
- [API](#api)
- [Motivation](#motivation)
- [Alternatives](#alternatives)
- [Changelog](#changelog)
  * [0.2.0](#020)
- [Feedback](#feedback)
- [License](#license)

<!-- tocstop -->

## Features

* Cache network requests automatically during test run
* Store responses in a straightforward file structure
* Modify cached responses for test
* Reuse cache between test runs
* Inspect response body as a pretty formatted JSON
* No manual mocks maintenance
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
1. Extend `test` instance with  `cacheRoute` fixture:
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

See more examples below.

## Examples

### Cache request for a single test
<details>
  <summary>Click to expand</summary>

Cache GET requests to `/api/cats` in a particular test:
```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats');
  // ...
});
```

All subsequent test runs will also re-use cached response. To invalidate that cache, delete files or provide `forceUpdate` option.

If you need to match with unknown query params, use glob pattern:
```ts
await cacheRoute.GET('/api/cats*');
```
</details>

### Cache request for all tests

<details>
  <summary>Click to expand</summary>

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
</details>

### Modify cached response

<details>
  <summary>Click to expand</summary>

Set `modify` option. Inside this function, you can get the json / text from the response, modify it and call [`route.fulfill`](https://playwright.dev/docs/mock#modify-api-responses) with modified data:
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
</details>

### Disable cache

<details>
  <summary>Click to expand</summary>

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

> **Note:** When cache is disabled, response is still transformed by `modify` functions

</details>

### Force cache update

<details>
  <summary>Click to expand</summary>

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
</details>

### Match by request fields

<details>
  <summary>Click to expand</summary>

By default, only URL pattern defines which requests will be matched and cached.
If you need more customized control, use `match` option. 
Example of matching GET requests only to `/api/cats?foo=bar`:

```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats*', { 
    match: req => new URL(req.url()).searchParams.get('foo') === 'bar'
  });
  // ...
});
```

> Notice `*` in `/api/cats*` to match query params

</details>

### Match by response HTTP status

<details>
  <summary>Click to expand</summary>

By default, only responses with `2xx` status are considered valid and stored to cache.
If you need to test error responses, provide additional `httpStatus` option to cache route:

```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats', { 
    httpStatus: 500 
  });
  // ...
});
```
Now error response is cached in the following structure:
```
.network-cache
└── example.com
    └── api-cats
        └── GET
            └── 500
                ├── headers.json
                └── body.json
```
</details>

### Separation of cache files

<details>
  <summary>Click to expand</summary>

You may want to have a separate cache for a particular test. For that you can utilize `cacheRoute.options.extraDir` - an array of extra directories to be inserted into the cache path. You can freely transform that array during test.

```ts
test('test', async ({ page, cacheRoute }) => {
  cacheRoute.options.extraDir.push('custom-test');
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
</details>

### Split cache files by request query / body

<details>
  <summary>Click to expand</summary>

To split cache by request query params, you can set `extraDir` option in cache route:
```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats*', {
    extraDir: req => new URL(req.url()).searchParams.toString()
  });
  // ...
});
```

> Notice `*` in `/api/cats*` to match query params

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

> **Note:** `extraDir` from request route with be appended to `cacheRoute.options.extraDir`.

Splitting cache files by request body:
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

</details>

## Multi-step cache in complex scenarios
For complex scenarios, you may want to have different cache for the same API call during the test. Example: testing scenario of adding a new todo item into the todo list.

With caching in mind, the plan for such test can be the following:

1. Set cache for GET request to return original todo items
2. Load the page
3. Set cache for POST request to create new todo item
4. Set cache for GET request to return updated todo items
5. Enter todo text and click "Add" button
6. Assert that todo list is updated

The implementation utilizes `extraDir` option to dynamically change cache path in the test checkpoints. 

```ts
test('adding todo', async ({ page, cacheRoute }) => {
  // setup cache for getting todo items
  await cacheRoute.GET('/api/todo');

  // ...load page

  // CHECKPOINT: store all below caches in a new directory
  cacheRoute.options.extraDir.push('after-add');
  // setup cache for creating a todo item
  await cacheRoute.POST('/api/todo');
  
  // ...add todo item
  // ...reload page
  // ...assert todo list is updated
});
```
Generated cache structure:
```
.network-cache
└── example.com
    └── api-todo
        ├── GET
        │   ├── headers.json
        │   ├── body.json          # <- original response
        │   └── after-add
        │       ├── headers.json
        │       └── body.json      # <- updated response
        └── POST
            └── after-add
                ├── headers.json
                └── body.json
```

## API
All actual options are described in code.

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

### 0.2.0
* new api released (breaking)

## Feedback
Feel free to share your feedback and suggestions in [issues](https://github.com/vitalets/playwright-network-cache/issues).

## License
[MIT](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)