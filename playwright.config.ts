import { defineConfig } from '@playwright/test';

const PORT = 31379;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'test',
  fullyParallel: true,
  globalSetup: './test/global-setup.ts',
  use: {
    baseURL,
    viewport: { width: 800, height: 600 },
  },
  expect: {
    timeout: 1000,
  },
  webServer: {
    command: 'npx ts-node test/app/server',
    env: { PORT: String(PORT) },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
