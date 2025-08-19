// api/index.js
const serverless = require('serverless-http');
const path = require('path');

let handler; // lazy init

module.exports = async (req, res) => {
  // Normalize URL (Vercel forwards the original path)
  const url = req.url || '';

  // Fast path for the API root so we never hang here
  if (url === '/api' || url === '/api/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Backend is running');
    return;
  }

  // Lazily wrap the Express app (avoids heavy import on first ping)
  if (!handler) {
    const app = require(path.join('..', 'backend', 'server.js'));
    handler = serverless(app, { basePath: '/api' });
  }

  return handler(req, res);
};
