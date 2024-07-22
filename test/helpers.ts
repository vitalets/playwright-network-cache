import fs from 'node:fs';
import path from 'node:path';
import { cacheConfig } from '../playwright.config';

export function json(filePath: string) {
  const fullPath = path.join(cacheConfig.baseDir, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(content);
}
