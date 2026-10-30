export function prettifyJson(data: string | Record<string, unknown>) {
  const obj = typeof data === 'string' ? JSON.parse(data) : data;
  return JSON.stringify(obj, null, 2);
}

const reRelativePath = /^\.+(\\|\/)|^\.+$/;
// eslint-disable-next-line no-control-regex
const filenameReservedRegex = /[<>:"/\\|?*\u0000-\u001F]/g;

/**
 * See: https://github.com/sindresorhus/filenamify
 *
 * There is implementation in Playwright, it replaces more characters with "-", compared to filenamify.
 * At least, " " and ".". But for our case, it's not suitable. We need to keep "." in dir as file extension from URL.
 * E.g. caching "example.com/index.html" creates dir "index.html", not "index-html"
 * So, just replace spaces with "-".
 * See: https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/utils/fileUtils.ts#L55
 */
export function filenamify(s: string, replacement = '-') {
  return (
    s
      .replace(reRelativePath, replacement) // prettier-ignore
      .replace(filenameReservedRegex, replacement)
      // Replace spaces with replacement, from Playwright
      .replace(/\s+/g, replacement)
  );
}

export function toArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value];
}

export function toFunction<T, K>(value: T | ((...args: K[]) => T)) {
  return typeof value === 'function' ? (value as (...args: K[]) => T) : () => value;
}

export function trimSlash(s: string) {
  return s.replace(/^\/+|\/+$/, '');
}
