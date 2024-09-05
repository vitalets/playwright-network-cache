import { CacheRouteOptions } from './options';

export const defaults = {
  baseDir: '.network-cache',
  // Default template is:
  // {hostname}/{pathname}/{httpMethod}/{extraCacheDir}/{httpStatus}
  buildCacheDir: (ctx) => [
    ctx.hostname, // prettier-ignore
    ctx.pathname,
    ctx.httpMethod,
    ctx.extraDir,
    ctx.httpStatus,
  ],
} satisfies Pick<CacheRouteOptions, 'baseDir' | 'buildCacheDir'>;
