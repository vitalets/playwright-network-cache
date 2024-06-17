/**
 * Class representing headers cache file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ResponseInfo } from '../types';
import { prettifyJson } from '../utils';

export class HeadersFile {
  path: string;

  constructor(dir: string) {
    this.path = path.join(dir, 'headers.json');
  }

  stat() {
    return fs.existsSync(this.path) ? fs.statSync(this.path) : null;
  }

  async read() {
    const content = await fs.promises.readFile(this.path, 'utf8');
    return JSON.parse(content) as ResponseInfo;
  }

  async save(responseInfo: ResponseInfo) {
    await this.ensureDir();
    await fs.promises.writeFile(this.path, prettifyJson(responseInfo));
  }

  private async ensureDir() {
    await fs.promises.mkdir(path.dirname(this.path), { recursive: true });
  }
}
