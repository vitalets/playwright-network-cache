# playwright-network-cache
[![lint](https://github.com/vitalets/playwright-network-cache/actions/workflows/lint.yaml/badge.svg)](https://github.com/vitalets/playwright-network-cache/actions/workflows/lint.yaml)
[![test](https://github.com/vitalets/playwright-network-cache/actions/workflows/test.yaml/badge.svg)](https://github.com/vitalets/playwright-network-cache/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/playwright-network-cache)](https://www.npmjs.com/package/playwright-network-cache)
[![license](https://img.shields.io/npm/l/playwright-network-cache)](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)

Speed up [Playwright](https://playwright.dev/) tests by caching network requests on the filesystem.

#### ✨ Features

- Automatically cache network requests during test execution
- Save responses to the filesystem in a clear, organized structure
- Modify cached responses dynamically during runtime
- Reuse cached data across multiple test runs
- Configure TTL to automatically refresh the cache and keep responses up-to-date
- View response bodies in a pretty formatted JSON
- No need for manual mocks management
- No mess with the HAR format — see [motivation](#motivation)

Example of cache structure:
```
.network-cache
└── example.com
    └── api-cats
        └── GET
            ├── headers.json
            └── body.json
```

## Index
<!-- doc-gen TOC maxDepth="3" excludeText="Index" -->
- [Installation](#installation)
- [Basic usage](#basic-usage)
- [Examples](#examples)
  - [Cache request for all tests](#cache-request-for-all-tests)
  - [Modify cached response](#modify-cached-response)
  - [Disable cache](#disable-cache)
  - [Force cache update](#force-cache-update)
  - [Additional match by HTTP status](#additional-match-by-http-status)
  - [Additional match by request fields](#additional-match-by-request-fields)
  - [Separation of cache files](#separation-of-cache-files)
  - [Change base dir](#change-base-dir)
  - [Split cache files by request query / body](#split-cache-files-by-request-query--body)
  - [Multi-step cache in complex scenarios](#multi-step-cache-in-complex-scenarios)
- [API](#api)
  - [Constructor](#constructor)
  - [Methods](#methods)
  - [Options](#options)
- [Debug](#debug)
- [Motivation](#motivation)
- [Alternatives](#alternatives)
- [Changelog](#changelog)
  - [0.2.0](#020)
- [Feedback](#feedback)
- [License](#license)
<!-- end-doc-gen -->

## Installation
Install from npm:
```
npm i -D playwright-network-cache
```

## Basic usage

#### 1. Setup `cacheRoute` fixture

Extend Playwright's `test` instance with  `cacheRoute` fixture:
```ts
// fixtures.ts
import { test as base } from '@playwright/test';
import { CacheRoute } from 'playwright-network-cache';

type Fixtures = {
  cacheRoute: CacheRoute;
};

export const test = base.extend<Fixtures>({
  cacheRoute: async ({ page }, use) => {
    await use(new CacheRoute(page, { /* cache options */ }));
  },
});
```

#### 2. Use `cacheRoute` inside test
For example, to cache a GET request to `https://example.com/api/cats`:
```ts
// test.ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('https://example.com/api/cats*');
  // ... perform usual test actions
});
```

On the first run, the test will hit real API and store the response on the filesystem:
```
.network-cache
└── example.com
    └── api-cats
        └── GET
            ├── headers.json
            └── body.json
```
All subsequent test runs will re-use cached response and execute much faster. You can invalidate that cache by manually deleting the files. Or provide `ttlMinutes` option to hit real API once in some period of time.

You can call `cacheRoute.GET|POST|PUT|PATCH|DELETE|ALL` to cache routes with respective HTTP method. [Url pattern](https://playwright.dev/docs/api/class-page#page-route-option-url) can contain `*` or `**` to match url segments and query params.

To catch requests targeting your own app APIs, you can omit hostname in url:
```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats*');
  // ...
});
```

Default cache path is: 
```
{baseDir}/{hostname}/{pathname}/{httpMethod}/{extraDir}/{httpStatus}
```

See more examples below or check [configuration options](#options).

## Examples

### Invalidate cache once in a hour

<details>
  <summary>Click to expand</summary>

To keep response data up-to-date, you can automatically invalidate cache after configured time period. Set `ttlMinutes` option to desired value in minutes:
```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats', {
    ttlMinutes: 60 // hit real API once in a hour
  });
  // ...
});
```
</details>

### Modify cached response

<details>
  <summary>Click to expand</summary>

You can modify the cached response by setting the `modify` option to a custom function. In this function, you retrieve the response data, make your changes, and then call [`route.fulfill`](https://playwright.dev/docs/mock#modify-api-responses) with the updated data.
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
For modifying JSON responses, there is a helper option `modifyJSON`:
```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats', {
    modifyJSON: (json) => {
      json[0].name = 'Kitty';
    },
  });
  // ...
});
```
`modifyJSON` can modify response json in-place (like above) or return some result, which will overwrite the original data.
</details>

### Disable cache

<details>
  <summary>Click to expand</summary>

To disable cache in a **single test**, set `cacheRoute.options.noCache` to `true`:
```ts
test('test', async ({ page, cacheRoute }) => {
  cacheRoute.options.noCache = true;
  await cacheRoute.GET('/api/cats'); // <- this will not cache the request
  // ...
});
```

To disable cache in **all tests**, set the `noCache` option to `true` in the fixture:
```ts
export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: async ({ page }, use, testInfo) => {
    await use(new CacheRoute(page, {
      noCache: true
    }));
  }
});
```

> **Note:** When cache is disabled, `modify` functions still run

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

To force updating cache files for **all tests**, set the `forceUpdate` option to `true` in the fixture:
```ts
export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: async ({ page }, use, testInfo) => {
    await use(new CacheRoute(page, {
      forceUpdate: true
    }));
  }
});
```
</details>

### Auto-cache request for all tests

<details>
  <summary>Click to expand</summary>

You can setup caching of some request for all tests. To achieve that, define `cacheRoute` as **auto** fixture and setup cached routes.
For example:
```ts
export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: [async ({ page }, use) => {
    const cacheRoute = new CacheRoute(page);
    await cacheRoute.GET('/api/cats');
    await use(cacheRoute);
  }, { auto: true }]
});
```
</details>

### Additional match by HTTP status

<details>
  <summary>Click to expand</summary>

By default, only responses with `2xx` status are considered valid and stored in cache.
To test error responses, provide additional `httpStatus` option to cache route:

```ts
test('test', async ({ page, cacheRoute }) => {
  await cacheRoute.GET('/api/cats', { 
    httpStatus: 500 
  });
  // ...
});
```
Now error response will be cached in the following structure:
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

### Additional match by request fields

<details>
  <summary>Click to expand</summary>

By default, requests are matched by:
```
HTTP method + URL pattern + (optionally) HTTP status 
```
If you need to match by other request fields, provide custom function to `match` option. 
Example of matching GET requests with query param `/api/cats?foo=bar`:

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

### Isolate cache for particular test

<details>
  <summary>Click to expand</summary>

By default, cache files are stored in a shared directory and re-used across tests.
You may want to isolate cache files for a particular test. For that, utilize `cacheRoute.options.extraDir` - an array of extra directories to be inserted into the cache path. You can freely transform that array during the test.

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
            └── custom-test       # <- extra directory
                ├── headers.json
                └── body.json
```

To automatically store cache files in a separate directories for **each test**, 
you can set `extraDir` option in a fixture setup:
```ts
export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: async ({ page }, use, testInfo) => {
    await use(new CacheRoute(page, {
      extraDir: testInfo.title  // <- use testInfo.title as a unique extraDir
    }));
  }
});
```
After running two tests with titles `custom test 1` and `custom test 2`,
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

### Change base dir

<details>
  <summary>Click to expand</summary>

By default, cache files are stored in `.network-cache` base directory. To change this location, set `baseDir` option:

```ts
export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: async ({ page }, use, testInfo) => {
    await use(new CacheRoute(page, {
      baseDir: `test/.network-cache`
    }));
  }
});
```
Moreover, you can set separate `baseDir` for each Playwright project or each test:
```ts
export const test = base.extend<{ cacheRoute: CacheRoute }>({
  cacheRoute: async ({ page }, use, testInfo) => {
    await use(new CacheRoute(page, {
      baseDir: `test/.network-cache/${testInfo.project.name}`
    }));
  }
});
```
Example of generated structure
```
.network-cache
├── project-one
│   └── example.com
│       └── api-cats
│           └── GET
│               ├── headers.json
│               └── body.json
└── project-two
    └── example.com
        └── api-cats
            └── GET
                ├── headers.json
                └── body.json

```

> In that example, you get more isolation, but less cache re-use. It's a trade-off, as always 🤷‍♂️

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

### Multi-step cache in complex scenarios

<details>
  <summary>Click to expand</summary>

For complex scenarios, you may want to have different cache for the same API call during the test. Example: testing scenario of adding a new todo item into the todo list.

With caching in mind, the plan for such test can be the following:

1. Set cache for GET request to return original todo items
2. Load the page
3. Set cache for POST request to create new todo item
4. Set cache for GET request to return updated todo items
5. Enter todo text and click "Add" button
6. Assert todo list is updated

The implementation utilizes `extraDir` option to dynamically change cache path in the test: 

```ts
test('adding todo', async ({ page, cacheRoute }) => {
  // set cache for GET request to load todo items
  await cacheRoute.GET('/api/todo');

  // ...load page

  // CHECKPOINT: change cache dir, all subsequent requests will be stored separately
  cacheRoute.options.extraDir.push('after-add');
  // set cache for POST request to create a todo item
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
        │   ├── body.json
        │   └── after-add
        │       ├── headers.json
        │       └── body.json
        └── POST
            └── after-add
                ├── headers.json
                └── body.json
```

> You may still modify cached responses to match test expectation. But it's better to make it as *replacement* modifications, not changing the structure of the response body. Keeping response structure is more "end-2-end" approach for Playwright tests.

</details>

## API
The `CacheRoute` class manages caching of routes for a Playwright `Page` or `BrowserContext`. It simplifies setting up HTTP method handlers for specific routes with caching options.

### Constructor

```ts
const cacheRoute = new CacheRoute(page, options?)
```

- **page**: The Playwright `Page` or `BrowserContext` to manage routes.
- **options**: Optional configuration to control caching behavior.

### Methods

These methods enable caching for specific HTTP routes:

- `cacheRoute.GET(url, optionsOrFn?)`
- `cacheRoute.POST(url, optionsOrFn?)`
- `cacheRoute.PUT(url, optionsOrFn?)`
- `cacheRoute.PATCH(url, optionsOrFn?)`
- `cacheRoute.DELETE(url, optionsOrFn?)`
- `cacheRoute.HEAD(url, optionsOrFn?)`
- `cacheRoute.ALL(url, optionsOrFn?)`

#### Params
- **url**: [Url pattern](https://playwright.dev/docs/api/class-page#page-route-option-url)
- **optionsOrFn**: Caching options or a function to modify the response

### Options
You can provide options to `CacheRoute` constructor or modify them dynamically via `cacheRoute.options`. All values are optional.

#### baseDir
`string`

Base directory for cache files.

#### extraDir
`string | string[] | ((req: Request) => string | string[])`

Additional directory for cache files. Can be a string, array of strings, or a function that accepts a request and returns a string or an array of strings.

#### match
`(req: Request) => boolean`

Function to add additional matching logic for requests. Returns `true` to cache, or `false` to skip.

#### httpStatus
`number`

Cache responses with the specified HTTP status code.

#### ttlMinutes
`number`

Time to live for cached responses, in minutes.

#### overrides
`RequestOverrides | ((req: Request) => RequestOverrides)`

Object or function that provides request [overrides](https://playwright.dev/docs/api/class-route#route-fetch) (e.g., headers, body) when making real calls.

#### modify
`(route: Route, response: APIResponse) => Promise<unknown>`

Function to modify the response before caching. This is called for each route.

#### modifyJSON
`(json: any) => any`

Helper function to modify JSON responses before caching.

#### noCache
`boolean`

If `true`, disables caching and always makes requests to the server.

#### forceUpdate
`boolean`

If `true`, always requests from the server and updates the cached files.

#### buildCacheDir
`(ctx: BuildCacheDirArg) => string[]`

Function to build a custom cache directory, providing fine-grained control over the cache file location.
[Default implementation](https://github.com/vitalets/playwright-network-cache/blob/main/src/CacheRoute/defaults.ts).

## Debug
To debug caching, run Playwright with the following `DEBUG` environment variable:
```bash
DEBUG=playwright-network-cache npx playwright test
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

### 0.2.1
* handle requests after page is closed

### 0.2.0
* new api released (breaking)

## Feedback
Feel free to share your feedback and suggestions in [issues](https://github.com/vitalets/playwright-network-cache/issues).

## License
[MIT](https://github.com/vitalets/playwright-network-cache/blob/main/LICENSE)