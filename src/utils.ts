export function isJsonResponse(headers: Record<string, string>) {
  return headers['content-type']?.includes('application/json');
}

export function prettifyJson(data: string | Record<string, unknown>) {
  const obj = typeof data === 'string' ? JSON.parse(data) : data;
  return JSON.stringify(obj, null, 2);
}

const reRelativePath = /^\.+(\\|\/)|^\.+$/;
// eslint-disable-next-line no-control-regex
const filenameReservedRegex = /[<>:"/\\|?*\u0000-\u001F]/g;

/**
 * See: https://github.com/sindresorhus/filenamify
 */
export function filenamify(s: string, replacement = '-') {
  return s
    .replace(reRelativePath, replacement) // prettier-ignore
    .replace(filenameReservedRegex, replacement);
}

export function toArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value];
}
