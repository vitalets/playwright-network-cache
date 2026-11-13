/**
 * Class representing headers cache file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { prettifyJson } from '../utils';

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

  save(responseInfo: ResponseInfo) {
    this.ensureDir();
    // Write to temp file + rename, so parallel workers never leave a half-overwritten file.
    // See: https://github.com/vitalets/playwright-network-cache/issues/10
    const tmpPath = `${this.path}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, prettifyJson(responseInfo));
    fs.renameSync(tmpPath, this.path);
  }

  private ensureDir() {
    fs.mkdirSync(path.dirname(this.path), { recursive: true });
  }

  private stat() {
    return fs.existsSync(this.path) ? fs.statSync(this.path) : null;
  }
}
