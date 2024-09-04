import { CacheRouteOptions } from './options';

export const defaults = {
  baseDir: '.network-cache',
  // Default template is:
  // {hostname}/{pathname}/{httpMethod}/{groupDir}/{checkpointDir}/{httpStatus}/{appendDir}
  buildCacheDir: (ctx) => [
    ctx.hostname, // prettier-ignore
    ctx.pathname,
    ctx.httpMethod,
    ctx.groupDir,
    ctx.checkpointDir,
    ctx.httpStatus,
    ctx.appendDir,
  ],
} satisfies Pick<CacheRouteOptions, 'baseDir' | 'buildCacheDir'>;
