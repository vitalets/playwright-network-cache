import { defineConfig } from '@playwright/test';

const baseURL = 'http://localhost:4000';

export default defineConfig({
  testDir: 'test',
  reporter: 'line',
  use: {
    baseURL
  },
  webServer: {
    command: 'npx ts-node ./server',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
