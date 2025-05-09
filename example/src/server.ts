import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import timers from 'timers/promises';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4321;
const logger = console;

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
  logger.log(req.method, req.url);

  if (req.method === 'GET' && req.url === '/') {
    const filePath = path.join(__dirname, 'index.html');
    const content = await fs.readFile(filePath);
    res.setHeader('Content-Type', 'text/html');
    res.end(content);
    return;
  }

  // get cats
  if (req.method === 'GET' && req.url === '/api/cats') {
    await timers.setTimeout(1000); // delay
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(cats));
    return;
  }

  // add cat
  if (req.method === 'POST' && req.url?.startsWith('/api/cats')) {
    const name = new URLSearchParams(req.url.split('?')[1]).get('name');
    if (!name) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Name is required' }));
    } else {
      cats.unshift({ id: cats.length + 1, name, breed: 'Just Added', age: 42 });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    }

    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Not Found');
});

server.listen(PORT, () => {
  logger.log(`Server running at http://localhost:${PORT}/`);
});
