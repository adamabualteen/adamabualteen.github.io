#!/usr/bin/env node
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf',
  '.txt':  'text/plain',
  '.xml':  'text/xml',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0]; // strip query string

  // Resolve to file path
  let filePath = path.join(DIST, urlPath);

  // Directory → try index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Try with .html extension
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    filePath += '.html';
  }

  if (!fs.existsSync(filePath)) {
    const notFound = path.join(DIST, '404.html');
    const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : Buffer.from('404 Not Found');
    res.writeHead(404, { 'Content-Type': 'text/html' });
    return res.end(body);
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n  Site: http://localhost:${PORT}\n`);
});
