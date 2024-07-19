import fs from 'node:fs';
import path from 'node:path';

const cacheDir = process.env.NETWORK_CACHE_DIR!;

export function json(filePath: string) {
  const fullPath = path.join(cacheDir, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(content);
}
