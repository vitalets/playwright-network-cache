/**
 * Class representing body cache file.
 */
import fs from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';
import { prettifyJson } from '../utils';
import { ResponseInfo } from './HeadersFile';

export class BodyFile {
  path: string;

  constructor(
    dir: string,
    private responseInfo: ResponseInfo,
  ) {
    this.path = path.join(dir, this.getFilename());
  }

  private isJson() {
    return this.path.endsWith('.json');
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

  private getFilename() {
    const contentType = this.responseInfo.headers['content-type'];
    const extension = mime.extension(contentType || '') || 'bin';
    return `body.${extension}`;
  }
}
