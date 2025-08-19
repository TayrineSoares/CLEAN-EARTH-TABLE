// api/index.js
const serverless = require('serverless-http');
const path = require('path');

let handler; // lazy init

module.exports = async (req, res) => {
  const url = req.url || '';

  // Fast path for API root so it never hangs
  if (url === '/api' || url === '/api/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Backend is running');
    return;
  }

  // Lazily wrap the Express app
  if (!handler) {
    console.time('load-express');
    const app = require(path.join('..', 'backend', 'server.js'));
    console.timeEnd('load-express');
    handler = serverless(app); // ⬅️ no basePath — we’ll rewrite req.url below
    console.log('serverless handler ready');
  }

  // Normalize the path so Express sees "/cart" instead of "/api/cart"
  if (req.url.startsWith('/api/')) {
    req.url = req.url.slice(4) || '/';
  } else if (req.url === '/api') {
    req.url = '/';
  }

  return handler(req, res);
};
