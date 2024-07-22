import { defineConfig } from '@playwright/test';
import { defineNetworkCacheConfig } from './src';

export const cacheConfig = defineNetworkCacheConfig({
  baseDir: 'test/.network-cache',
  ttl: 10,
});

const baseURL = 'http://localhost:3000';

export default defineConfig({
  testDir: 'test',
  use: {
    baseURL,
    viewport: { width: 800, height: 600 },
  },
  expect: {
    timeout: 1000,
  },
  webServer: {
    command: 'npx ts-node test/app/server',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
