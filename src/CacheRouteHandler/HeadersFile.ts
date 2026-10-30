/**
 * Class representing headers cache file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { prettifyJson, writeFileAtomic } from '../utils';

export type ResponseInfo = {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
};

export class HeadersFile {
  path: string;

  constructor(dir: string) {
    this.path = path.join(dir, 'headers.json');
  }

  getLastModified() {
    return this.stat()?.mtimeMs || 0;
  }

  async read() {
    const content = await fs.promises.readFile(this.path, 'utf8');
    return JSON.parse(content) as ResponseInfo;
  }

  async save(responseInfo: ResponseInfo) {
    await writeFileAtomic(this.path, prettifyJson(responseInfo));
  }

  private stat() {
    return fs.existsSync(this.path) ? fs.statSync(this.path) : null;
  }
}
