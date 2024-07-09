import { defineConfig } from '@playwright/test';

process.env.NETWORK_CACHE_DIR = 'test/.network-cache';

const baseURL = 'http://localhost:3000';

export default defineConfig({
  testDir: 'test',
  use: {
    baseURL,
  },
  webServer: {
    command: 'npx ts-node test/app/server',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
