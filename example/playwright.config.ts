import { defineConfig } from '@playwright/test';

const baseURL = 'http://localhost:4000';

export default defineConfig({
  testDir: 'test',
  use: {
    baseURL,
  },
  webServer: {
    command: 'npx ts-node ./src',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
