import { defineConfig } from '@playwright/test';

const baseURL = `http://localhost:4321`;

export default defineConfig({
  testDir: 'test',
  fullyParallel: true,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx ts-node ./src/server',
    url: baseURL,
    env: {
      PORT: new URL(baseURL).port,
    },
  },
});
