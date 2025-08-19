// api/index.js
const serverless = require('serverless-http');
const path = require('path');

// Load the exported Express app
const app = require(path.join('..', 'backend', 'server.js'));

// Wrap it for Vercel serverless
module.exports = serverless(app, { basePath: '/api' });
