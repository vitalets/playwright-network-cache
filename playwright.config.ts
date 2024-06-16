import { defineConfig } from '@playwright/test';

const baseURL = 'http://localhost:3000';

export default defineConfig({
  testDir: 'test',
  reporter: 'line',
  use: {
    baseURL
  },
  webServer: {
    command: 'npx ts-node test/server',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
