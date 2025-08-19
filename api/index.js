// api/index.js
const path = require('path');

let app; // lazy init

module.exports = async (req, res) => {
  const url = req.url || '';

  // Fast path for the API root so it never hangs
  if (url === '/api' || url === '/api/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Backend is running');
    return;
  }

  // Lazily load the Express app (speeds up cold start)
  if (!app) {
    console.time('load-express');
    app = require(path.join('..', 'backend', 'server.js'));
    console.timeEnd('load-express');
    console.log('express app ready');
  }

  // Strip the /api prefix so Express sees the real path (e.g., "/cart")
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api(\/|$)/, '/');
  }

  // Hand off directly to Express (it’s a plain Node handler)
  return app(req, res);
};
