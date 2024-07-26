import { defineNetworkCacheConfig, NetworkCacheConfig } from './config';
import { cacheRouteFactory, CacheRouteOptions } from './cacheRouteFactory';

export { defineNetworkCacheConfig, NetworkCacheConfig, CacheRouteOptions };

export const cacheRoute = {
  GET: cacheRouteFactory('GET'),
  POST: cacheRouteFactory('POST'),
  PUT: cacheRouteFactory('PUT'),
  PATCH: cacheRouteFactory('PATCH'),
  DELETE: cacheRouteFactory('DELETE'),
  HEAD: cacheRouteFactory('HEAD'),
  ALL: cacheRouteFactory('ALL'),
};
