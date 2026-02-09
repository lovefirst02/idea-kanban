const express = require('express');
const path = require('path');
const chokidar = require('chokidar');
const api = require('./api');
const { IDEAS_PATH } = require('./markdown');

const app = express();
const PORT = process.env.PORT || 3456;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', api);

// SSE for live updates
let clients = [];

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

function sendEvent(event, data) {
  clients.forEach(client => {
    client.write(`event: ${event}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Watch for file changes
const watcher = chokidar.watch(IDEAS_PATH, {
  persistent: true,
  ignoreInitial: true
});

watcher.on('all', (event, filepath) => {
  console.log(`File ${event}: ${filepath}`);
  sendEvent('refresh', { event, filepath });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🎯 Idea Kanban Board                           ║
║                                                   ║
║   Running at: http://localhost:${PORT}             ║
║                                                   ║
║   Data path: ${IDEAS_PATH}
║                                                   ║
║   Press Ctrl+C to stop                           ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
