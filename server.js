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

// Parse project folders: "1. my-project" → { number: 1, name: "my-project" }
function parseProjectFolders() {
  const items = fs.readdirSync(__dirname);
  const projects = [];

  for (const item of items) {
    const fullPath = path.join(__dirname, item);
    // Skip files, node_modules, hidden folders, and anything that doesn't match pattern
    if (!fs.statSync(fullPath).isDirectory()) continue;
    if (item === 'node_modules') continue;
    if (item.startsWith('.')) continue;
    
    // Match pattern: "number. name"
    const match = item.match(/^(\d+)\.\s*(.+)$/);
    if (!match) continue;
    
    const number = parseInt(match[1]);
    const name = match[2].trim();
    
    // Check if preview.png exists
    const previewPath = path.join(fullPath, 'preview.png');
    const hasPreview = fs.existsSync(previewPath);
    
    // Check if index.html exists
    const indexPath = path.join(fullPath, 'index.html');
    const hasIndex = fs.existsSync(indexPath);
    
    projects.push({
      number,
      name,
      folderName: item,
      hasPreview,
      hasIndex,
      previewPath: hasPreview ? `/projects/${item}/preview.png` : null,
      indexPath: hasIndex ? `/projects/${item}/index.html` : null
    });
  }

  // Sort by number
  projects.sort((a, b) => a.number - b.number);
  return projects;
}

// Generate the dashboard HTML
function generateDashboard(projects) {
  // Count how many projects have preview images
  const previewCount = projects.filter(p => p.hasPreview).length;
  
  let cardsHtml = '';
  for (const project of projects) {
    const previewImg = project.hasPreview 
      ? `<img src="${project.previewPath}" alt="${project.name}" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="no-preview">🖼️<br><span>No preview</span></div>`;
    
    const clickUrl = project.hasIndex ? project.indexPath : '#';
    const clickClass = project.hasIndex ? '' : 'disabled';
    
    cardsHtml += `
      <div class="card ${clickClass}" onclick="${project.hasIndex ? `window.location.href='${project.indexPath}'` : ''}">
        <div class="card-image">
          ${previewImg}
        </div>
        <div class="card-content">
          <h3>${project.name}</h3>
          <span class="project-number">#${project.number}</span>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📁 Project Dashboard</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background: #0a0e17;
        color: #e6edf3;
        min-height: 100vh;
        padding: 40px 20px;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
      }
      
      /* Header */
      .header {
        margin-bottom: 40px;
        text-align: center;
      }
      
      .header h1 {
        font-size: 2.8rem;
        font-weight: 700;
        background: linear-gradient(135deg, #58a6ff, #f0883e);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.5px;
      }
      
      .header p {
        color: #8b949e;
        font-size: 1.1rem;
        margin-top: 8px;
        -webkit-text-fill-color: #8b949e;
      }
      
      .header .stats {
        display: inline-block;
        margin-top: 12px;
        padding: 6px 20px;
        background: #161b22;
        border-radius: 20px;
        border: 1px solid #30363d;
        font-size: 0.9rem;
        color: #8b949e;
        -webkit-text-fill-color: #8b949e;
      }
      
      .header .stats span {
        color: #f0f6fc;
        font-weight: 600;
        -webkit-text-fill-color: #f0f6fc;
      }
      
      /* Grid */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 24px;
      }
      
      /* Card */
      .card {
        background: #161b22;
        border-radius: 16px;
        border: 1px solid #30363d;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        position: relative;
      }
      
      .card:hover {
        transform: translateY(-6px);
        border-color: #58a6ff;
        box-shadow: 0 12px 40px rgba(88, 166, 255, 0.15);
      }
      
      .card.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .card.disabled:hover {
        transform: none;
        border-color: #30363d;
        box-shadow: none;
      }
      
      .card-image {
        width: 100%;
        aspect-ratio: 16 / 9;
        background: #0d1117;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
      }
      
      .card-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
      
      .card:hover .card-image img {
        transform: scale(1.03);
      }
      
      .no-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #484f58;
        font-size: 2.5rem;
        height: 100%;
        width: 100%;
        gap: 8px;
      }
      
      .no-preview span {
        font-size: 0.8rem;
        color: #484f58;
      }
      
      .card-content {
        padding: 16px 20px 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .card-content h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #f0f6fc;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 75%;
      }
      
      .project-number {
        font-size: 0.7rem;
        font-weight: 500;
        color: #8b949e;
        background: #0d1117;
        padding: 2px 10px;
        border-radius: 12px;
        border: 1px solid #30363d;
        flex-shrink: 0;
      }
      
      /* Empty state */
      .empty-state {
        text-align: center;
        padding: 80px 20px;
        color: #8b949e;
      }
      
      .empty-state .emoji {
        font-size: 4rem;
        display: block;
        margin-bottom: 16px;
      }
      
      .empty-state h2 {
        font-size: 1.5rem;
        color: #f0f6fc;
        margin-bottom: 8px;
      }
      
      .empty-state p {
        font-size: 1rem;
        color: #8b949e;
      }
      
      /* Responsive */
      @media (max-width: 600px) {
        .header h1 {
          font-size: 2rem;
        }
        .grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .card-content h3 {
          font-size: 0.9rem;
        }
      }
      
      /* Scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #0d1117;
      }
      ::-webkit-scrollbar-thumb {
        background: #30363d;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #484f58;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📁 Project Dashboard</h1>
        <p>Your learning journey, one project at a time</p>
        <div class="stats">
          📦 <span>${projects.length}</span> projects &nbsp;·&nbsp; 🖼️ <span>${previewCount}</span> with previews
        </div>
      </div>
      
      ${projects.length > 0 ? `<div class="grid">${cardsHtml}</div>` : `
        <div class="empty-state">
          <span class="emoji">📭</span>
          <h2>No projects found</h2>
          <p>Create folders matching the pattern: <code>#. project-name</code></p>
          <p style="margin-top: 8px; font-size: 0.85rem; color: #484f58;">Example: <code>1. google-clone</code>, <code>2. weather-app</code></p>
        </div>
      `}
    </div>
  </body>
  </html>`;
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url);
  
  // Serve the dashboard (root path)
  if (url === '/' || url === '') {
    const projects = parseProjectFolders();
    const html = generateDashboard(projects);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }
  
  // Serve project files (preview.png, index.html, etc.)
  // URLs like: /projects/1. google-clone/preview.png
  const match = url.match(/^\/projects\/(.+?)\/(.+)$/);
  if (match) {
    const folderName = match[1];
    const fileName = match[2];
    const fullPath = path.join(__dirname, folderName, fileName);
    
    // Security: prevent directory traversal
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(__dirname)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        const ext = path.extname(fullPath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const content = fs.readFileSync(fullPath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        return;
      }
    } catch (err) {
      // File not found
    }
  }
  
  // 404
  res.writeHead(404);
  res.end(`<h1>404 - Not Found</h1><p>The requested path "${url}" does not exist.</p>`);
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Project Dashboard running at http://localhost:${PORT}`);
  console.log(`📁 Scanning for project folders matching: "#. name"`);
  console.log(`🖼️  Place a preview.png in each project folder for thumbnails`);
  console.log(`📂 Click any card to open its index.html`);
});