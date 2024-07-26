/**
 * Global config.
 */

import { CacheRouteOptions } from './cacheRouteFactory';

export type NetworkCacheConfig = Pick<CacheRouteOptions, 'baseDir' | 'ttl'> & {
  disabled?: boolean;
};

const defaults = {
  baseDir: '.network-cache',
} satisfies Pick<NetworkCacheConfig, 'baseDir'>;

export const config = Object.assign({} as NetworkCacheConfig, defaults);

export function defineNetworkCacheConfig(userConfig?: NetworkCacheConfig) {
  return Object.assign(config, userConfig);
}
