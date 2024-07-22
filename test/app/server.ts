import http from 'http';
import fs from 'fs/promises';
import path from 'path';

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
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(cats));
    return;
  }

  const filePath = path.join(__dirname, 'index.html');
  const content = await fs.readFile(filePath);
  res.setHeader('Content-Type', 'text/html');
  res.end(content);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${PORT}/`);
});
