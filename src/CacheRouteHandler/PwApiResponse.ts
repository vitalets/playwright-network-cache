/**
 * Extracting Playwright's APIResponse class.
 * Use require() with abs path, because this class is not exported.
 * See: https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/client/fetch.ts#L286
 */
import path from 'node:path';

// can't make it lazy, because it's used in the class extends
export const PwApiResponse = getPlaywrightClientApi().APIResponse;

function getPlaywrightClientApi() {
  const pwCoreRoot = getPlaywrightCoreRoot();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(`${pwCoreRoot}/lib/client/api`);
}

function getPlaywrightCoreRoot() {
  const pwCoreRoot = resolvePackageRoot('playwright-core');
  if (!pwCoreRoot) {
    throw new Error('Cannot find playwright-core package. Please install @playwright/test');
  }
  return pwCoreRoot;
}

function resolvePackageRoot(packageName: string) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  return path.dirname(packageJsonPath);
}
