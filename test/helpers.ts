import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import { cacheConfig } from '../playwright.config';

export function json(filePath: string) {
  const fullPath = path.join(cacheConfig.baseDir, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(content);
}

export function expectFileExists(filePath: string) {
  const fullPath = path.join(cacheConfig.baseDir, filePath);
  expect(fs.existsSync(fullPath)).toEqual(true);
}
