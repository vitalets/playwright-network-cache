/**
 * Global config.
 */

import { CacheDirFn } from './CacheEntry';
import { CacheRouteOptions } from './CacheRoute';

export type NetworkCacheConfig = Pick<CacheRouteOptions, 'ttl'> & {
  /* Base dir for cache files */
  baseDir?: string;
  /* Custom function to calculate cache dir inside baseDir */
  cacheDirFn?: CacheDirFn;
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
