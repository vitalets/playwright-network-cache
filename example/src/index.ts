import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import timers from 'timers/promises';

const PORT = 4000;

interface Cat {
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
  if (req.url === '/' && req.method === 'GET') {
    await serveIndex(res);
  } else if (req.url === '/api/cats' && req.method === 'GET') {
    // Add a delay of 2 seconds before sending the response
    await timers.setTimeout(2000);
    await serverApi(res);
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${PORT}/`);
});

async function serveIndex(res: http.ServerResponse) {
  const filePath = path.join(__dirname, 'index.html');
  const content = await fs.readFile(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(content);
}

async function serverApi(res: http.ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(cats));
}
