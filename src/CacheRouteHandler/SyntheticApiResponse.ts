/**
 * Minimal APIResponse-like object backed by cached files.
 *
 * Why this exists:
 * - `modify` and `modifyJSON` callbacks expect an `APIResponse`-compatible object.
 * - cached responses do not come from Playwright internals, so we cannot pass them to
 *   `route.fulfill({ response })`.
 * - instead we expose the APIResponse methods we use, and then fulfill via explicit
 *   `{ status, headers, body }` in the route handler.
 */
import { APIResponse } from '@playwright/test';
import { ResponseInfo } from './HeadersFile';

export class SyntheticApiResponse implements APIResponse {
  constructor(
    private info: ResponseInfo,
    private bodyBuffer: Buffer,
  ) {}

  ok() {
    return this.status() >= 200 && this.status() < 300;
  }

  status() {
    return this.info.status;
  }

  statusText() {
    return this.info.statusText;
  }

  url() {
    return this.info.url;
  }

  headers() {
    return this.info.headers;
  }

  headersArray() {
    return Object.entries(this.info.headers).map(([name, value]) => ({ name, value }));
  }

  async body() {
    return this.bodyBuffer;
  }

  async text() {
    return (await this.body()).toString('utf8');
  }

  async json() {
    return JSON.parse(await this.text());
  }

  async dispose() {}
  async [Symbol.asyncDispose]() {}
}
