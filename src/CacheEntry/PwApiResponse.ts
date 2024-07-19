/**
 * Extracting Playwright's APIResponse class.
 * Use require() with abs path, because this class is not exported.
 * See: https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/client/fetch.ts#L286
 */
import path from 'node:path';

const pwCoreRoot = resolvePackageRoot('playwright-core');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pwClientModule = require(`${pwCoreRoot}/lib/client/api`);

export const PwApiResponse = pwClientModule.APIResponse;

function resolvePackageRoot(packageName: string) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  return path.dirname(packageJsonPath);
}
