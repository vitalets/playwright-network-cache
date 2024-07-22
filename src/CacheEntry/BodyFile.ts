/**
 * Class representing body cache file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { isJsonResponse, prettifyJson } from '../utils';
import { ResponseInfo } from './HeadersFile';

export class BodyFile {
  path: string;

  constructor(
    dir: string,
    private responseInfo: ResponseInfo,
  ) {
    const bodyFilename = this.isJson() ? 'body.json' : 'body.txt';
    this.path = path.join(dir, bodyFilename);
  }

  private isJson() {
    return isJsonResponse(this.responseInfo.headers);
  }

  async read() {
    return fs.promises.readFile(this.path);
  }

  async save(body: Buffer) {
    const content = this.isJson() ? prettifyJson(body.toString('utf8')) : body;
    await this.ensureDir();
    await fs.promises.writeFile(this.path, content);
  }

  private async ensureDir() {
    await fs.promises.mkdir(path.dirname(this.path), { recursive: true });
  }
}
