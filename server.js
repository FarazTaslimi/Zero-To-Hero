const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types
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
  '.txt': 'text/plain',
  '.md': 'text/markdown'
};

// Generate directory listing
function generateDirectoryList(dirPath, urlPath) {
  const items = fs.readdirSync(dirPath);
  
  let html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📁 ${urlPath || '/'}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background: #0d1117;
        color: #c9d1d9;
        padding: 40px 20px;
        max-width: 900px;
        margin: 0 auto;
      }
      h1 {
        font-size: 1.8rem;
        font-weight: 600;
        margin-bottom: 24px;
        border-bottom: 1px solid #30363d;
        padding-bottom: 16px;
        color: #f0f6fc;
      }
      h1 span {
        color: #8b949e;
        font-weight: 400;
      }
      .path {
        font-size: 0.9rem;
        color: #8b949e;
        margin-bottom: 20px;
        background: #161b22;
        padding: 8px 14px;
        border-radius: 6px;
        border: 1px solid #30363d;
        word-break: break-all;
      }
      .path a {
        color: #58a6ff;
        text-decoration: none;
      }
      .path a:hover { text-decoration: underline; }
      ul {
        list-style: none;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 6px;
        background: #161b22;
        border-radius: 8px;
        border: 1px solid #30363d;
        padding: 8px 0;
      }
      li {
        padding: 8px 16px;
        border-radius: 4px;
        transition: background 0.15s;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      li:hover { background: #1f242f; }
      li a {
        color: #58a6ff;
        text-decoration: none;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }
      li a:hover { text-decoration: underline; }
      .icon {
        font-size: 1.2rem;
        flex-shrink: 0;
        width: 24px;
        text-align: center;
      }
      .file-size {
        font-size: 0.75rem;
        color: #8b949e;
        flex-shrink: 0;
      }
      .empty {
        color: #8b949e;
        padding: 40px;
        text-align: center;
        font-style: italic;
        background: #161b22;
        border-radius: 8px;
        border: 1px solid #30363d;
      }
      .footer {
        margin-top: 30px;
        font-size: 0.8rem;
        color: #484f58;
        text-align: center;
        border-top: 1px solid #21262d;
        padding-top: 20px;
      }
      .footer span { color: #f0883e; }
    </style>
  </head>
  <body>
    <h1>📁 <span>${urlPath || '/'}</span></h1>
    <div class="path">📂 Path: /${urlPath || ''}</div>
    <ul>`;

  // Parent directory link
  if (urlPath && urlPath !== '') {
    const parentPath = urlPath.split('/').slice(0, -1).join('/');
    html += `<li>
      <a href="/${parentPath}">
        <span class="icon">📂</span> ..
      </a>
    </li>`;
  }

  // Sort: folders first, then files
  const sortedItems = items.sort((a, b) => {
    const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
    const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  let hasItems = false;

  for (const item of sortedItems) {
    if (item.startsWith('.')) continue;
    
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    const isDir = stat.isDirectory();
    const itemUrl = `${urlPath ? urlPath + '/' : ''}${encodeURIComponent(item)}`;
    
    let icon = isDir ? '📂' : '📄';
    let size = '';
    if (!isDir) {
      const bytes = stat.size;
      if (bytes < 1024) size = `${bytes} B`;
      else if (bytes < 1048576) size = `${(bytes / 1024).toFixed(1)} KB`;
      else size = `${(bytes / 1048576).toFixed(1)} MB`;
    }
    
    html += `<li>
      <a href="/${itemUrl}">
        <span class="icon">${icon}</span>
        ${item}
        ${isDir ? '/' : ''}
      </a>
      ${!isDir ? `<span class="file-size">${size}</span>` : ''}
    </li>`;
    hasItems = true;
  }

  if (!hasItems) {
    html += `<div class="empty">📭 This folder is empty</div>`;
  }

  html += `</ul>
    <div class="footer">⚡ Server running on port ${PORT} &nbsp;|&nbsp; 📂 Static file server</div>
  </body>
  </html>`;

  return html;
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url);
  let filePath = urlPath === '/' ? '' : urlPath;
  const cleanPath = filePath.replace(/^\/+/, '');
  const fullPath = path.join(__dirname, cleanPath);

  try {
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const dirList = generateDirectoryList(fullPath, cleanPath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(dirList);
      return;
    }

    const ext = path.extname(fullPath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const fileContent = fs.readFileSync(fullPath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fileContent);

  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404);
      res.end(`<h1>404 - Not Found</h1><p>The requested path "${urlPath}" does not exist.</p>`);
    } else {
      res.writeHead(500);
      res.end(`<h1>500 - Server Error</h1><p>${err.message}</p>`);
    }
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`📂 Click on any folder to explore, click any file to view it.`);
});