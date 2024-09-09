import fs from 'fs';

export default function clearCacheDir() {
  fs.rmSync('test/.network-cache', { recursive: true, force: true });
}
