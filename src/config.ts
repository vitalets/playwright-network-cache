/**
 * Global config.
 */

import { CacheRouteOptions } from './CacheRoute';

export type NetworkCacheConfig = Pick<CacheRouteOptions, 'baseDir' | 'ttl'> & {
  /* Disables network cache globally */
  disabled?: boolean;
};

const defaults = {
  baseDir: '.network-cache',
} satisfies Pick<NetworkCacheConfig, 'baseDir'>;

export const config = Object.assign({} as NetworkCacheConfig, defaults);

export function defineNetworkCacheConfig(userConfig?: NetworkCacheConfig) {
  return Object.assign(config, userConfig);
}
