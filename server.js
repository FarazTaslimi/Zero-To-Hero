const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 3000;

// Create HTTP server
const server = http.createServer((req, res) => {
  // Get file path from URL
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // Get file extension
  const ext = path.extname(filePath);
  let contentType = 'text/html';

  // Set proper MIME types
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain'
  };
  if (mimeTypes[ext]) contentType = mimeTypes[ext];

  // Read and serve the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 - File Not Found');
      } else {
        res.writeHead(500);
        res.end('500 - Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Create WebSocket server for live reload
const wss = new WebSocketServer({ server });

// Keep track of connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

// Watch for file changes
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const reloadClients = debounce(() => {
  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket open
      client.send('reload');
    }
  }
}, 100); // Wait 100ms after last change

// Watch all files in the project directory (except node_modules)
const watchDir = __dirname;
fs.watch(watchDir, { recursive: true }, (eventType, filename) => {
  // Ignore node_modules, .git, and hidden files
  if (!filename || 
      filename.includes('node_modules') || 
      filename.includes('.git') ||
      filename.startsWith('.')) {
    return;
  }
  console.log(`File changed: ${filename}`);
  reloadClients();
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🔄 Live reload enabled!`);
});