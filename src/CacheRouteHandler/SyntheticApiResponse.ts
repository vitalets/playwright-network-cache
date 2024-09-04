/**
 * Class representing cached response in Playwright's APIResponse interface.
 */
import { APIResponse } from '@playwright/test';
import { PwApiResponse } from './PwApiResponse';
import { ResponseInfo } from './HeadersFile';

// Important to inherit from Playwright's APIResponse,
// because route.fulfill() checks response via instance of:
// https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/client/network.ts#L364
export class SyntheticApiResponse extends PwApiResponse implements APIResponse {
  constructor(
    private info: ResponseInfo,
    private bodyBuffer: Buffer,
  ) {
    super({}, { headers: [] });
  }

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
