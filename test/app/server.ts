import http from 'http';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import timers from 'timers/promises';

const PORT = 3000;

export interface Cat {
  id: number;
  name: string;
  breed: string;
  age: number;
}

const cats: Cat[] = [
  { id: 1, name: 'Whiskers', breed: 'Siamese', age: 2 },
  { id: 2, name: 'Mittens', breed: 'Maine Coon', age: 3 },
  { id: 3, name: 'Shadow', breed: 'Russian Blue', age: 4 },
];

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url?.includes('/api/cats')) {
    if (req.url.includes('delay')) await timers.setTimeout(1000);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(cats));
    return;
  }

  const urlFilePath = req.url && req.url.length > 1 ? path.join(__dirname, req.url) : null;
  const indexFilePath = path.join(__dirname, 'index.html');
  const filePath = urlFilePath && fs.existsSync(urlFilePath) ? urlFilePath : indexFilePath;
  const content = await fs.promises.readFile(filePath);
  const contentType = mime.contentType(path.extname(filePath)) || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.end(content);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${PORT}/`);
});
