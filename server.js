const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

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

function parseProjectFolders() {
  const items = fs.readdirSync(__dirname);
  const projects = [];
  for (const item of items) {
    const fullPath = path.join(__dirname, item);
    if (!fs.statSync(fullPath).isDirectory()) continue;
    if (item === 'node_modules' || item.startsWith('.')) continue;
    const match = item.match(/^(\d+)\.\s*(.+)$/);
    if (!match) continue;
    const number = parseInt(match[1]);
    const name = match[2].trim();
    const previewPath = path.join(fullPath, 'preview.png');
    const hasPreview = fs.existsSync(previewPath);
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
  projects.sort((a, b) => a.number - b.number);
  return projects;
}

function serveDashboard(res) {
  const projects = parseProjectFolders();
  const previewCount = projects.filter(p => p.hasPreview).length;
  let cardsHtml = '';
  for (const p of projects) {
    const img = p.hasPreview ? `<img src="${p.previewPath}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">` : `<div class="no-preview">🖼️<br><span>No preview</span></div>`;
    cardsHtml += `
      <div class="card" onclick="${p.hasIndex ? `window.location.href='${p.indexPath}'` : ''}" style="${!p.hasIndex ? 'opacity:0.5;cursor:not-allowed;' : ''}">
        <div class="card-image">${img}</div>
        <div class="card-content"><h3>${p.name}</h3><span class="project-number">#${p.number}</span></div>
      </div>
    `;
  }
  const html = `<!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>📁 Project Dashboard</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #0a0e17; color: #e6edf3; min-height: 100vh; padding: 40px 20px; }
    .container { max-width:1200px; margin:0 auto; }
    .header { margin-bottom:40px; text-align:center; }
    .header h1 { font-size:2.8rem; font-weight:700; background:linear-gradient(135deg,#58a6ff,#f0883e); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; letter-spacing:-0.5px; }
    .header p { color:#8b949e; font-size:1.1rem; margin-top:8px; }
    .header .stats { display:inline-block; margin-top:12px; padding:6px 20px; background:#161b22; border-radius:20px; border:1px solid #30363d; font-size:0.9rem; color:#8b949e; }
    .header .stats span { color:#f0f6fc; font-weight:600; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:24px; }
    .card { background:#161b22; border-radius:16px; border:1px solid #30363d; overflow:hidden; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); cursor:pointer; position:relative; }
    .card:hover { transform:translateY(-6px); border-color:#58a6ff; box-shadow:0 12px 40px rgba(88,166,255,0.15); }
    .card-image { width:100%; aspect-ratio:16/9; background:#0d1117; display:flex; align-items:center; justify-content:center; overflow:hidden; }
    .card-image img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease; }
    .card:hover .card-image img { transform:scale(1.03); }
    .no-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; color:#484f58; font-size:2.5rem; height:100%; width:100%; gap:8px; }
    .no-preview span { font-size:0.8rem; color:#484f58; }
    .card-content { padding:16px 20px 18px; display:flex; justify-content:space-between; align-items:center; }
    .card-content h3 { font-size:1rem; font-weight:600; color:#f0f6fc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:75%; }
    .project-number { font-size:0.7rem; font-weight:500; color:#8b949e; background:#0d1117; padding:2px 10px; border-radius:12px; border:1px solid #30363d; flex-shrink:0; }
    .empty-state { text-align:center; padding:80px 20px; color:#8b949e; }
    .empty-state .emoji { font-size:4rem; display:block; margin-bottom:16px; }
    .empty-state h2 { font-size:1.5rem; color:#f0f6fc; margin-bottom:8px; }
    .empty-state p { font-size:1rem; color:#8b949e; }
    @media (max-width:600px) { .header h1 { font-size:2rem; } .grid { grid-template-columns:1fr; gap:16px; } }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📁 Project Dashboard</h1>
        <p>Your learning journey, one project at a time</p>
        <div class="stats">📦 <span>${projects.length}</span> projects &nbsp;·&nbsp; 🖼️ <span>${previewCount}</span> with previews</div>
      </div>
      ${projects.length > 0 ? `<div class="grid">${cardsHtml}</div>` : `
        <div class="empty-state"><span class="emoji">📭</span><h2>No projects found</h2><p>Create folders matching: <code>#. project-name</code></p><p style="margin-top:8px;font-size:0.85rem;color:#484f58;">Example: <code>1. google-clone</code>, <code>2. weather-app</code></p></div>
      `}
    </div>
  </body>
  </html>`;
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

// ============================================================
// 🛠️ DEV TOOLS – Modern Bottom Panel (Complete Rewrite)
// ============================================================
const TOOLS_SCRIPT = `
(function() {
  'use strict';
  if (window.__dt_init) return;
  window.__dt_init = true;

  /* ===================== STATE ===================== */
  var state = {
    open: false,
    tab: 'elements',
    inspecting: false,
    selected: null,
    logs: [],
    requests: [],
    errorCount: 0,
    warnCount: 0,
    fps: 0,
    _frames: 0,
    _fpsTime: performance.now()
  };

  /* ===================== UTILS ===================== */
  var q = function(sel, ctx) { return (ctx || document).querySelector(sel); };
  var qa = function(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); };
  var esc = function(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

  function formatObj(v) {
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (typeof v === 'object') {
      try { return JSON.stringify(v, null, 2); } catch(e) { return String(v); }
    }
    return String(v);
  }

  function getBreadcrumb(el) {
    var parts = [];
    var cur = el;
    while (cur && cur !== document) {
      var s = cur.tagName.toLowerCase();
      if (cur.id) s += '#' + cur.id;
      else if (cur.className && typeof cur.className === 'string') {
        var cls = cur.className.trim().split(/\\s+/).slice(0, 2).join('.');
        if (cls) s += '.' + cls;
      }
      parts.unshift(s);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  function getUsefulStyles(el) {
    var cs = getComputedStyle(el);
    var props = ['display','position','width','height','margin','padding','color','background-color','font-size','font-weight','line-height','border','border-radius','box-shadow','opacity','overflow','flex-direction','justify-content','align-items','gap'];
    var out = [];
    for (var i = 0; i < props.length; i++) {
      var val = cs.getPropertyValue(props[i]);
      if (val && val !== 'none' && val !== '0px' && val !== 'normal' && val !== 'medium' && val !== 'visible' && val !== 'auto') {
        out.push({ prop: props[i], val: val });
      }
    }
    return out;
  }

  /* ===================== CSS ===================== */
  var styleEl = document.createElement('style');
  styleEl.textContent = \`
    .dt-fab{position:fixed;bottom:24px;left:24px;width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#7c5cfc,#5a3fd4);border:none;color:#fff;font-size:20px;cursor:pointer;box-shadow:0 4px 24px rgba(124,92,252,0.45);z-index:999999;display:flex;align-items:center;justify-content:center;transition:all .25s cubic-bezier(.4,0,.2,1);user-select:none;line-height:1}
    .dt-fab:hover{transform:translateY(-2px) scale(1.08);box-shadow:0 8px 32px rgba(124,92,252,0.55)}
    .dt-fab.active{background:linear-gradient(135deg,#5a3fd4,#4832b0);box-shadow:0 2px 16px rgba(124,92,252,0.6)}
    .dt-fab.hide{transform:scale(0);opacity:0;pointer-events:none}
    .dt-panel{position:fixed;bottom:0;left:0;right:0;height:38vh;min-height:220px;max-height:85vh;background:#0d1117;border-top:1px solid #21262d;z-index:999998;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;transform:translateY(100%);transition:transform .3s cubic-bezier(.4,0,.2,1)}
    .dt-panel.open{transform:translateY(0)}
    .dt-resizer{height:5px;cursor:ns-resize;flex-shrink:0;position:relative}
    .dt-resizer::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48px;height:3px;background:#30363d;border-radius:3px;transition:background .15s}
    .dt-resizer:hover::after,.dt-resizer.active::after{background:#7c5cfc;width:64px}
    .dt-tabbar{display:flex;align-items:center;background:#161b22;border-bottom:1px solid #21262d;padding:0 6px;flex-shrink:0;overflow-x:auto;gap:1px}
    .dt-tabbar::-webkit-scrollbar{height:0}
    .dt-dash-link{padding:7px 12px;color:#484f58;font-size:.75rem;text-decoration:none;white-space:nowrap;transition:color .15s;flex-shrink:0;border-right:1px solid #21262d;margin-right:4px}
    .dt-dash-link:hover{color:#7c5cfc}
    .dt-tab{padding:8px 14px;background:none;border:none;border-bottom:2px solid transparent;color:#8b949e;font-size:.8rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:all .15s;font-family:inherit;display:flex;align-items:center;gap:6px}
    .dt-tab:hover{color:#e6edf3;background:rgba(255,255,255,.03)}
    .dt-tab.active{color:#e6edf3;border-bottom-color:#7c5cfc}
    .dt-badge{background:#f85149;color:#fff;font-size:.6rem;padding:0 5px;border-radius:8px;min-width:16px;text-align:center;line-height:16px;display:none;font-weight:600}
    .dt-badge.show{display:inline-block}
    .dt-spacer{flex:1}
    .dt-close{background:none;border:none;color:#484f58;cursor:pointer;padding:6px 10px;font-size:1.1rem;border-radius:6px;transition:all .15s;line-height:1}
    .dt-close:hover{color:#f0f6fc;background:rgba(255,255,255,.06)}
    .dt-content{flex:1;overflow:hidden;position:relative}
    .dt-pane{position:absolute;inset:0;overflow:auto;display:none;flex-direction:column;padding:12px}
    .dt-pane.active{display:flex}
    .dt-pane::-webkit-scrollbar{width:5px;height:5px}
    .dt-pane::-webkit-scrollbar-track{background:transparent}
    .dt-pane::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px}
    .dt-pane::-webkit-scrollbar-thumb:hover{background:#484f58}
    .dt-bar{display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-shrink:0;flex-wrap:wrap}
    .dt-btn{padding:5px 12px;background:#21262d;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;font-size:.78rem;cursor:pointer;transition:all .15s;font-family:inherit;white-space:nowrap}
    .dt-btn:hover{background:#30363d;border-color:#484f58;color:#f0f6fc}
    .dt-btn.primary{background:#7c5cfc;border-color:#7c5cfc;color:#fff}
    .dt-btn.primary:hover{background:#6b4fe0}
    .dt-btn.danger{background:rgba(248,81,73,.12);border-color:rgba(248,81,73,.3);color:#f85149}
    .dt-btn.danger:hover{background:rgba(248,81,73,.22)}
    .dt-btn.active{background:#7c5cfc;border-color:#7c5cfc;color:#fff}
    .dt-breadcrumb{color:#8b949e;font-size:.76rem;font-family:"SF Mono",Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
    .dt-breadcrumb b{color:#7c5cfc;font-weight:500}
    .dt-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#30363d;text-align:center;gap:6px;user-select:none}
    .dt-empty .ico{font-size:2.2rem;opacity:.6}
    .dt-empty .txt{font-size:.85rem;color:#484f58}
    .dt-empty .sub{font-size:.75rem;color:#30363d}
    .dt-detail-section{margin-bottom:14px}
    .dt-label{color:#484f58;font-size:.68rem;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;font-weight:600}
    .dt-code{color:#c9d1d9;background:#161b22;padding:10px 12px;border-radius:8px;border:1px solid #21262d;font-family:"SF Mono",Consolas,monospace;font-size:.78rem;word-break:break-all;line-height:1.65;overflow:auto;max-height:200px;white-space:pre-wrap}
    .dt-code .t{color:#7ee787}.dt-code .a{color:#d2a8ff}.dt-code .v{color:#a5d6ff}.dt-code .p{color:#79c0ff}.dt-code .s{color:#ffa657}
    .dt-style-row{display:flex;gap:8px;padding:2px 0;font-family:"SF Mono",Consolas,monospace;font-size:.76rem}
    .dt-style-row .p{color:#79c0ff;flex-shrink:0;min-width:120px}
    .dt-style-row .v{color:#c9d1d9;word-break:break-all}
    .dt-entries{flex:1;overflow:auto;font-family:"SF Mono",Consolas,monospace;font-size:.78rem;background:#0a0d12;border-radius:8px;border:1px solid #21262d}
    .dt-entry{padding:4px 10px;border-bottom:1px solid #161b22;display:flex;align-items:flex-start;gap:8px;line-height:1.5;animation:dtFlash .4s ease}
    .dt-entry:hover{background:rgba(255,255,255,.015)}
    .dt-entry.log{color:#e6edf3}.dt-entry.error{color:#f85149;background:rgba(248,81,73,.05)}.dt-entry.warn{color:#d29922;background:rgba(210,153,34,.05)}.dt-entry.info{color:#58a6ff}.dt-entry.result{color:#8b949e;font-style:italic}
    .dt-time{color:#30363d;font-size:.68rem;flex-shrink:0;padding-top:2px}
    .dt-msg{word-break:break-word;flex:1;white-space:pre-wrap}
    .dt-input-row{display:flex;gap:6px;margin-top:8px;flex-shrink:0}
    .dt-input{flex:1;padding:7px 10px;background:#0a0d12;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font-family:"SF Mono",Consolas,monospace;font-size:.78rem;outline:none}
    .dt-input:focus{border-color:#7c5cfc}
    .dt-table{width:100%;border-collapse:collapse;font-size:.76rem;font-family:"SF Mono",Consolas,monospace}
    .dt-table th{text-align:left;padding:6px 10px;color:#8b949e;font-weight:500;border-bottom:1px solid #30363d;position:sticky;top:0;background:#0d1117;z-index:1}
    .dt-table td{padding:4px 10px;border-bottom:1px solid #161b22;color:#c9d1d9;max-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dt-table tr:hover td{background:rgba(255,255,255,.015)}
    .dt-s-ok{color:#3fb950}.dt-s-warn{color:#d29922}.dt-s-err{color:#f85149}.dt-meth{color:#7c5cfc}
    .dt-src-wrap{flex:1;overflow:auto;background:#0a0d12;border-radius:8px;border:1px solid #21262d;position:relative}
    .dt-src-code{display:flex;font-family:"SF Mono",Consolas,monospace;font-size:.76rem;line-height:1.65;min-height:100%}
    .dt-src-lines{padding:10px 0;text-align:right;color:#21262d;user-select:none;border-right:1px solid #21262d;flex-shrink:0;min-width:44px}
    .dt-src-lines div{padding:0 10px}
    .dt-src-text{padding:10px 12px;color:#c9d1d9;white-space:pre;flex:1;overflow-x:auto;tab-size:2}
    .dt-perf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
    .dt-perf-card{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:14px 16px}
    .dt-perf-card .lbl{color:#8b949e;font-size:.72rem;margin-bottom:4px}
    .dt-perf-card .val{color:#e6edf3;font-size:1.4rem;font-weight:700;font-family:"SF Mono",Consolas,monospace}
    .dt-perf-card .val.acc{color:#7c5cfc}.dt-perf-card .val.grn{color:#3fb950}.dt-perf-card .val.red{color:#f85149}
    .dt-perf-card .sub{color:#30363d;font-size:.68rem;margin-top:2px}
    .dt-tools-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
    .dt-tool-card{background:#161b22;border:1px solid #21262d;border-radius:12px;padding:16px;transition:border-color .15s}
    .dt-tool-card:hover{border-color:#30363d}
    .dt-tool-card h4{color:#e6edf3;font-size:.85rem;margin-bottom:6px;font-weight:600}
    .dt-tool-card p{color:#8b949e;font-size:.76rem;margin-bottom:10px;line-height:1.45}
    .dt-color-row{display:flex;gap:8px;align-items:center}
    .dt-color-swatch{width:36px;height:36px;border-radius:8px;border:2px solid #30363d;flex-shrink:0;transition:border-color .15s}
    .dt-color-input{width:42px;height:36px;border:none;border-radius:6px;cursor:pointer;background:none;padding:0}
    .dt-color-hex{flex:1;padding:7px 10px;background:#0a0d12;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font-family:"SF Mono",Consolas,monospace;font-size:.82rem;outline:none}
    .dt-color-hex:focus{border-color:#7c5cfc}
    .dt-colors{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
    .dt-csw{width:26px;height:26px;border-radius:6px;border:2px solid transparent;cursor:pointer;transition:all .15s}
    .dt-csw:hover{transform:scale(1.15);border-color:rgba(255,255,255,.25)}
    .dt-vp-vis{display:flex;align-items:center;justify-content:center;padding:20px;background:#0a0d12;border-radius:8px;border:1px solid #21262d;margin-top:8px}
    .dt-vp-box{border:2px solid #7c5cfc;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#7c5cfc;font-family:"SF Mono",Consolas,monospace;font-size:.78rem;transition:all .3s}
    .dt-highlight{position:fixed;pointer-events:none;z-index:999997;display:none;border:2px solid #7c5cfc;background:rgba(124,92,252,.07);transition:top .06s,left .06s,width .06s,height .06s}
    .dt-highlight-label{position:absolute;top:-20px;left:0;background:#7c5cfc;color:#fff;font-size:.66rem;padding:1px 6px;border-radius:3px;font-family:"SF Mono",Consolas,monospace;white-space:nowrap}
    body.dt-inspect{cursor:crosshair!important}
    body.dt-inspect *{cursor:crosshair!important}
    @keyframes dtFlash{0%{background:rgba(124,92,252,.08)}100%{background:transparent}}
    @media(max-width:640px){.dt-panel{height:55vh}.dt-tab{padding:7px 10px;font-size:.75rem}.dt-tools-grid{grid-template-columns:1fr}}
  \`;
  document.head.appendChild(styleEl);

  /* ===================== DOM ===================== */
  var fab = document.createElement('button');
  fab.className = 'dt-fab';
  fab.textContent = '⊕';
  fab.title = 'Dev Tools (Ctrl+Shift+T)';
  document.body.appendChild(fab);

  var highlight = document.createElement('div');
  highlight.className = 'dt-highlight';
  var hlLabel = document.createElement('div');
  hlLabel.className = 'dt-highlight-label';
  highlight.appendChild(hlLabel);
  document.body.appendChild(highlight);

  var panel = document.createElement('div');
  panel.className = 'dt-panel';
  panel.innerHTML = \`
    <div class="dt-resizer"></div>
    <div class="dt-tabbar">
      <a class="dt-dash-link" href="/">← Dashboard</a>
      <button class="dt-tab active" data-t="elements">Elements</button>
      <button class="dt-tab" data-t="console">Console<span class="dt-badge" id="dt-cbadge"></span></button>
      <button class="dt-tab" data-t="network">Network<span class="dt-badge" id="dt-nbadge"></span></button>
      <button class="dt-tab" data-t="sources">Sources</button>
      <button class="dt-tab" data-t="performance">Performance</button>
      <button class="dt-tab" data-t="tools">Tools</button>
      <div class="dt-spacer"></div>
      <button class="dt-close" title="Close (Esc)">✕</button>
    </div>
    <div class="dt-content">
      <div class="dt-pane active" data-p="elements">
        <div class="dt-bar">
          <button class="dt-btn primary" id="dt-pick-btn">⬚ Pick Element</button>
          <div class="dt-breadcrumb" id="dt-breadcrumb">Select an element to inspect</div>
        </div>
        <div id="dt-el-details" style="flex:1;overflow:auto">
          <div class="dt-empty"><div class="ico">⬚</div><div class="txt">Click "Pick Element" then hover over the page</div><div class="sub">Click an element to inspect its properties</div></div>
        </div>
      </div>
      <div class="dt-pane" data-p="console">
        <div class="dt-bar">
          <button class="dt-btn" id="dt-clear-con">Clear</button>
          <span style="color:#484f58;font-size:.72rem" id="dt-con-count"></span>
        </div>
        <div class="dt-entries" id="dt-con-out"><div class="dt-empty"><div class="ico">📋</div><div class="txt">Console output will appear here</div></div></div>
        <div class="dt-input-row">
          <input class="dt-input" id="dt-con-in" placeholder="Evaluate expression..." autocomplete="off" spellcheck="false">
          <button class="dt-btn primary" id="dt-con-run">Run</button>
        </div>
      </div>
      <div class="dt-pane" data-p="network">
        <div class="dt-bar">
          <button class="dt-btn" id="dt-clear-net">Clear</button>
          <span style="color:#484f58;font-size:.72rem" id="dt-net-count"></span>
        </div>
        <div style="flex:1;overflow:auto;border-radius:8px;border:1px solid #21262d" id="dt-net-wrap">
          <table class="dt-table"><thead><tr><th>Method</th><th>URL</th><th>Status</th><th>Time</th></tr></thead><tbody id="dt-net-body"></tbody></table>
          <div class="dt-empty" id="dt-net-empty"><div class="ico">🌐</div><div class="txt">Network requests will appear here</div></div>
        </div>
      </div>
      <div class="dt-pane" data-p="sources">
        <div class="dt-bar">
          <button class="dt-btn" id="dt-src-copy">📋 Copy</button>
          <span style="color:#484f58;font-size:.72rem" id="dt-src-name"></span>
        </div>
        <div class="dt-src-wrap" id="dt-src-wrap"><div class="dt-empty"><div class="ico">📄</div><div class="txt">Loading source...</div></div></div>
      </div>
      <div class="dt-pane" data-p="performance">
        <div class="dt-perf-grid" id="dt-perf-grid"></div>
      </div>
      <div class="dt-pane" data-p="tools">
        <div class="dt-tools-grid">
          <div class="dt-tool-card">
            <h4>🎨 Color Picker</h4>
            <p>Pick any color from the page or use the palette</p>
            <div class="dt-color-row">
              <div class="dt-color-swatch" id="dt-cprev" style="background:#7c5cfc"></div>
              <input type="color" class="dt-color-input" id="dt-cinput" value="#7c5cfc">
              <input class="dt-color-hex" id="dt-chex" value="#7c5cfc" maxlength="7" spellcheck="false">
            </div>
            <div class="dt-colors" id="dt-cswatches"></div>
            <div style="margin-top:8px;display:flex;gap:6px">
              <button class="dt-btn primary" id="dt-ccopy">Copy</button>
              <button class="dt-btn" id="dt-ceyedrop" style="display:none">👁 Eyedropper</button>
            </div>
          </div>
          <div class="dt-tool-card">
            <h4>📱 Viewport</h4>
            <p>Current viewport dimensions and device info</p>
            <div style="font-family:'SF Mono',Consolas,monospace;font-size:.8rem;color:#c9d1d9;line-height:1.8" id="dt-vp-info"></div>
            <div class="dt-vp-vis"><div class="dt-vp-box" id="dt-vp-box"></div></div>
          </div>
          <div class="dt-tool-card">
            <h4>🗑️ Storage</h4>
            <p>Clear browser storage for this origin</p>
            <div style="font-family:'SF Mono',Consolas,monospace;font-size:.78rem;color:#8b949e;margin-bottom:10px;line-height:1.8" id="dt-stor-info"></div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="dt-btn danger" id="dt-clr-local">localStorage</button>
              <button class="dt-btn danger" id="dt-clr-session">sessionStorage</button>
              <button class="dt-btn danger" id="dt-clr-cookies">Cookies</button>
              <button class="dt-btn danger" id="dt-clr-all" style="background:rgba(248,81,73,.2)">Clear All</button>
            </div>
          </div>
          <div class="dt-tool-card">
            <h4>📸 Screenshot</h4>
            <p>Capture the current viewport as an image</p>
            <button class="dt-btn primary" id="dt-screenshot" style="width:100%">Capture Screenshot</button>
            <p style="font-size:.68rem;color:#30363d;margin-top:8px">Requires html2canvas library for full capture</p>
          </div>
        </div>
      </div>
    </div>
  \`;
  document.body.appendChild(panel);

  /* ===================== REFS ===================== */
  var resizer = q('.dt-resizer', panel);
  var tabs = qa('.dt-tab', panel);
  var panes = qa('.dt-pane', panel);
  var pickBtn = q('#dt-pick-btn');
  var breadcrumb = q('#dt-breadcrumb');
  var elDetails = q('#dt-el-details');
  var conOut = q('#dt-con-out');
  var conIn = q('#dt-con-in');
  var conCount = q('#dt-con-count');
  var cBadge = q('#dt-cbadge');
  var netBody = q('#dt-net-body');
  var netEmpty = q('#dt-net-empty');
  var netCount = q('#dt-net-count');
  var nBadge = q('#dt-nbadge');
  var srcWrap = q('#dt-src-wrap');
  var srcName = q('#dt-src-name');
  var perfGrid = q('#dt-perf-grid');
  var cInput = q('#dt-cinput');
  var cHex = q('#dt-chex');
  var cPrev = q('#dt-cprev');
  var cSwatches = q('#dt-cswatches');
  var vpInfo = q('#dt-vp-info');
  var vpBox = q('#dt-vp-box');
  var storInfo = q('#dt-stor-info');

  /* ===================== PANEL LOGIC ===================== */
  function openPanel() {
    state.open = true;
    panel.classList.add('open');
    fab.classList.add('active');
    if (state.tab === 'sources') loadSource();
    if (state.tab === 'performance') updatePerf();
    updateViewport();
    updateStorage();
    startFps();
  }
  function closePanel() {
    state.open = false;
    panel.classList.remove('open');
    fab.classList.remove('active');
    if (state.inspecting) stopInspect();
    stopFps();
  }
  function togglePanel() { state.open ? closePanel() : openPanel(); }

  fab.addEventListener('click', function(e) { e.stopPropagation(); togglePanel(); });
  q('.dt-close', panel).addEventListener('click', closePanel);

  function switchTab(name) {
    state.tab = name;
    tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.t === name); });
    panes.forEach(function(p) { p.classList.toggle('active', p.dataset.p === name); });
    if (name === 'sources') loadSource();
    if (name === 'performance') updatePerf();
  }
  tabs.forEach(function(t) { t.addEventListener('click', function() { switchTab(t.dataset.t); }); });

  /* ===================== RESIZER ===================== */
  var resizing = false, resizeY, resizeH;
  resizer.addEventListener('mousedown', function(e) {
    resizing = true; resizeY = e.clientY; resizeH = panel.offsetHeight;
    resizer.classList.add('active');
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e) {
    if (!resizing) return;
    var h = Math.min(Math.max(resizeH + (resizeY - e.clientY), 220), window.innerHeight * 0.85);
    panel.style.height = h + 'px';
  });
  document.addEventListener('mouseup', function() {
    if (resizing) { resizing = false; resizer.classList.remove('active'); document.body.style.cursor = ''; document.body.style.userSelect = ''; }
  });

  /* ===================== ELEMENTS / INSPECTOR ===================== */
  function isToolEl(el) { return el.closest && (el.closest('.dt-panel') || el.closest('.dt-fab') || el.closest('.dt-highlight')); }

  function updateHighlight(el) {
    if (!el || isToolEl(el)) { highlight.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    highlight.style.display = 'block';
    highlight.style.top = r.top + 'px';
    highlight.style.left = r.left + 'px';
    highlight.style.width = r.width + 'px';
    highlight.style.height = r.height + 'px';
    var tag = el.tagName.toLowerCase();
    var id = el.id ? '#' + el.id : '';
    var cls = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
    hlLabel.textContent = tag + id + (cls && cls !== '.' ? cls : '');
  }

  function startInspect() {
    state.inspecting = true;
    pickBtn.classList.add('active');
    pickBtn.textContent = '⏹ Stop';
    document.body.classList.add('dt-inspect');
  }
  function stopInspect() {
    state.inspecting = false;
    pickBtn.classList.remove('active');
    pickBtn.textContent = '⬚ Pick Element';
    document.body.classList.remove('dt-inspect');
    highlight.style.display = 'none';
  }

  pickBtn.addEventListener('click', function() { state.inspecting ? stopInspect() : startInspect(); });

  document.addEventListener('mouseover', function(e) {
    if (!state.inspecting || !state.open) return;
    updateHighlight(e.target);
  });

  document.addEventListener('click', function(e) {
    if (!state.inspecting || !state.open) return;
    if (isToolEl(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(e.target);
    stopInspect();
  }, true);

  function selectElement(el) {
    if (!el || el === document || el === document.documentElement) return;
    state.selected = el;
    breadcrumb.innerHTML = getBreadcrumb(el).replace(/([^ >]+)(?=>|$)/g, '<b>$1</b>');

    var tag = el.tagName.toLowerCase();
    var id = el.id ? ' <span class="a">#' + esc(el.id) + '</span>' : '';
    var cls = (el.className && typeof el.className === 'string' && el.className.trim()) ? ' <span class="a">.' + esc(el.className.trim().split(/\\s+/).join('.')) + '</span>' : '';
    var attrs = '';
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      if (a.name === 'class' || a.name === 'id') continue;
      attrs += ' <span class="a">' + esc(a.name) + '</span>=<span class="s">"' + esc(a.value) + '"</span>';
    }

    var htmlSrc = esc(el.outerHTML);
    if (htmlSrc.length > 600) htmlSrc = htmlSrc.slice(0, 600) + '\\n...';

    var styles = getUsefulStyles(el);
    var stylesHtml = styles.map(function(s) { return '<div class="dt-style-row"><span class="p">' + esc(s.prop) + '</span><span class="v">' + esc(s.val) + '</span></div>'; }).join('');

    elDetails.innerHTML = \`
      <div class="dt-detail-section">
        <div class="dt-label">Element</div>
        <div class="dt-code"><span class="t">&lt;\${tag}\${id}\${cls}\${attrs}&gt;</span></div>
      </div>
      <div class="dt-detail-section">
        <div class="dt-label">Dimensions &amp; Position</div>
        <div class="dt-code">
<span class="p">width:</span> <span class="v">\${el.offsetWidth}px</span>  <span class="p">height:</span> <span class="v">\${el.offsetHeight}px</span>
<span class="p">offsetTop:</span> <span class="v">\${el.offsetTop}px</span>  <span class="p">offsetLeft:</span> <span class="v">\${el.offsetLeft}px</span>
<span class="p">children:</span> <span class="v">\${el.children.length}</span>  <span class="p">textContent:</span> <span class="v">\${esc(el.textContent.slice(0, 80))}\${el.textContent.length > 80 ? '...' : ''}</span></div>
      </div>
      <div class="dt-detail-section">
        <div class="dt-label">Computed Styles</div>
        <div style="background:#161b22;border-radius:8px;border:1px solid #21262d;padding:6px 10px;overflow:auto;max-height:180px">\${stylesHtml || '<span style="color:#30363d">No notable styles</span>'}</div>
      </div>
      <div class="dt-detail-section">
        <div class="dt-label">HTML</div>
        <div class="dt-code">\${htmlSrc}</div>
      </div>
    \`;
  }

  /* ===================== CONSOLE ===================== */
  var origLog = console.log, origError = console.error, origWarn = console.warn, origInfo = console.info;

  function timeStr() { var d = new Date(); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0') + '.' + String(d.getMilliseconds()).padStart(3,'0'); }

  function addLog(type, args) {
    var entry = { type: type, msg: args.map(formatObj).join(' '), time: timeStr() };
    state.logs.push(entry);
    if (type === 'error') { state.errorCount++; updateBadge(cBadge, state.errorCount); }
    if (type === 'warn') { state.warnCount++; }
    renderLogEntry(entry);
    conCount.textContent = state.logs.length + ' entries';
  }

  function renderLogEntry(e) {
    if (q('.dt-empty', conOut)) conOut.innerHTML = '';
    var div = document.createElement('div');
    div.className = 'dt-entry ' + e.type;
    div.innerHTML = '<span class="dt-time">' + e.time + '</span><span class="dt-msg">' + esc(e.msg) + '</span>';
    conOut.appendChild(div);
    conOut.scrollTop = conOut.scrollHeight;
  }

  function updateBadge(el, count) {
    if (count > 0) { el.textContent = count; el.classList.add('show'); }
    else { el.classList.remove('show'); }
  }

  console.log = function() { addLog('log', Array.from(arguments)); origLog.apply(console, arguments); };
  console.error = function() { addLog('error', Array.from(arguments)); origError.apply(console, arguments); };
  console.warn = function() { addLog('warn', Array.from(arguments)); origWarn.apply(console, arguments); };
  console.info = function() { addLog('info', Array.from(arguments)); origInfo.apply(console, arguments); };

  q('#dt-clear-con').addEventListener('click', function() {
    state.logs = []; state.errorCount = 0; state.warnCount = 0;
    updateBadge(cBadge, 0);
    conOut.innerHTML = '<div class="dt-empty"><div class="ico">📋</div><div class="txt">Console cleared</div></div>';
    conCount.textContent = '';
  });

  function runConsole() {
    var expr = conIn.value.trim();
    if (!expr) return;
    addLog('log', ['> ' + expr]);
    try {
      var result = eval(expr);
      if (result instanceof Promise) {
        addLog('info', ['Promise (pending)']);
        result.then(function(r) { addLog('result', ['← ' + formatObj(r)]); }).catch(function(e) { addLog('error', ['← ' + e.message]); });
      } else {
        addLog('result', ['← ' + formatObj(result)]);
      }
    } catch(e) {
      addLog('error', [e.message]);
    }
    conIn.value = '';
  }
  q('#dt-con-run').addEventListener('click', runConsole);
  conIn.addEventListener('keydown', function(e) { if (e.key === 'Enter') runConsole(); });

  /* ===================== NETWORK ===================== */
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var method = (init && init.method) || 'GET';
    var url = typeof input === 'string' ? input : (input.url || String(input));
    var start = performance.now();
    return origFetch.apply(this, arguments).then(function(res) {
      addReq({ method: method, url: url, status: res.status, duration: Math.round(performance.now() - start) });
      return res;
    }).catch(function(err) {
      addReq({ method: method, url: url, status: 'ERR', duration: Math.round(performance.now() - start) });
      throw err;
    });
  };

  var origXhrOpen = XMLHttpRequest.prototype.open;
  var origXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._dt_m = method; this._dt_u = url; this._dt_s = performance.now();
    return origXhrOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    var xhr = this;
    xhr.addEventListener('load', function() { addReq({ method: xhr._dt_m, url: xhr._dt_u, status: xhr.status, duration: Math.round(performance.now() - xhr._dt_s) }); });
    xhr.addEventListener('error', function() { addReq({ method: xhr._dt_m, url: xhr._dt_u, status: 'ERR', duration: Math.round(performance.now() - xhr._dt_s) }); });
    return origXhrSend.apply(this, arguments);
  };

  function addReq(r) {
    state.requests.push(r);
    if (netEmpty.style.display !== 'none') netEmpty.style.display = 'none';
    var sc = r.status >= 200 && r.status < 300 ? 'dt-s-ok' : r.status >= 300 && r.status < 400 ? 'dt-s-warn' : 'dt-s-err';
    if (r.status === 'ERR') sc = 'dt-s-err';
    var tr = document.createElement('tr');
    tr.innerHTML = '<td class="dt-meth">' + esc(r.method) + '</td><td title="' + esc(r.url) + '">' + esc(r.url.split('/').pop() || r.url) + '</td><td class="' + sc + '">' + r.status + '</td><td>' + r.duration + 'ms</td>';
    tr.title = r.url;
    netBody.appendChild(tr);
    netCount.textContent = state.requests.length + ' requests';
    updateBadge(nBadge, state.requests.length);
  }

  q('#dt-clear-net').addEventListener('click', function() {
    state.requests = [];
    netBody.innerHTML = '';
    netEmpty.style.display = '';
    netCount.textContent = '';
    updateBadge(nBadge, 0);
  });

  /* ===================== SOURCES ===================== */
  var sourceLoaded = false;
  function loadSource() {
    if (sourceLoaded) return;
    sourceLoaded = true;
    srcName.textContent = window.location.pathname;
    fetch('/api/source?path=' + window.location.pathname).then(function(r) {
      if (!r.ok) throw new Error('Not found');
      return r.text();
    }).then(function(src) {
      var lines = src.split('\\n');
      var lineHtml = lines.map(function(_, i) { return '<div>' + (i + 1) + '</div>'; }).join('');
      var textHtml = esc(src);
      srcWrap.innerHTML = '<div class="dt-src-code"><div class="dt-src-lines">' + lineHtml + '</div><div class="dt-src-text">' + textHtml + '</div></div>';
    }).catch(function(err) {
      sourceLoaded = false; // allow retry
      srcWrap.innerHTML = '<div class="dt-empty"><div class="ico">⚠</div><div class="txt">Could not load source</div><div class="sub">' + esc(err.message || 'Unknown error') + '</div></div>';
    });
  }
  q('#dt-src-copy').addEventListener('click', function() {
    var codeEl = q('.dt-src-text', srcWrap);
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent).then(function() {
        var btn = q('#dt-src-copy');
        btn.textContent = '✓ Copied!';
        setTimeout(function() { btn.textContent = '📋 Copy'; }, 1500);
      });
    }
  });

  /* ===================== PERFORMANCE ===================== */
  var perfInterval = null;
  function updatePerf() {
    var nav = performance.getEntriesByType('navigation')[0];
    var mem = performance.memory;
    var domCount = document.querySelectorAll('*').length;
    var loadTime = nav ? (nav.loadEventEnd - nav.startTime) : 0;
    var domReady = nav ? (nav.domContentLoadedEventEnd - nav.startTime) : 0;

    perfGrid.innerHTML = \`
      <div class="dt-perf-card"><div class="lbl">DOM Nodes</div><div class="val">\${domCount}</div><div class="sub">Elements on page</div></div>
      <div class="dt-perf-card"><div class="lbl">FPS</div><div class="val \${state.fps >= 50 ? 'grn' : state.fps >= 30 ? '' : 'red'}">\${state.fps}</div><div class="sub">Frames per second</div></div>
      <div class="dt-perf-card"><div class="lbl">Load Time</div><div class="val \${loadTime < 1000 ? 'grn' : loadTime < 3000 ? '' : 'red'}">\${loadTime ? loadTime.toFixed(0) + 'ms' : 'N/A'}</div><div class="sub">Page fully loaded</div></div>
      <div class="dt-perf-card"><div class="lbl">DOM Ready</div><div class="val acc">\${domReady ? domReady.toFixed(0) + 'ms' : 'N/A'}</div><div class="sub">DOM parsed</div></div>
      <div class="dt-perf-card"><div class="lbl">Scripts</div><div class="val">\${document.scripts.length}</div><div class="sub">&lt;script&gt; tags</div></div>
      <div class="dt-perf-card"><div class="lbl">Images</div><div class="val">\${document.images.length}</div><div class="sub">&lt;img&gt; tags</div></div>
      \${mem ? '<div class="dt-perf-card"><div class="lbl">JS Heap</div><div class="val">' + (mem.usedJSHeapSize / 1048576).toFixed(1) + 'MB</div><div class="sub">of ' + (mem.jsHeapSizeLimit / 1048576).toFixed(0) + 'MB</div></div>' : ''}
    \`;
  }

  function startFps() {
    if (perfInterval) return;
    function tick() {
      state._frames++;
      var now = performance.now();
      if (now - state._fpsTime >= 1000) {
        state.fps = state._frames;
        state._frames = 0;
        state._fpsTime = now;
        if (state.open && state.tab === 'performance') updatePerf();
      }
      if (state.open) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function stopFps() { state.fps = 0; }

  /* ===================== TOOLS TAB ===================== */
  // Color Picker
  var swatchColors = ['#7c5cfc','#58a6ff','#3fb950','#f0883e','#f85149','#d2a8ff','#ffa657','#79c0ff','#56d4dd','#ff7b72','#e6edf3','#0d1117','#161b22','#30363d','#8b949e','#484f58'];
  swatchColors.forEach(function(c) {
    var s = document.createElement('div');
    s.className = 'dt-csw';
    s.style.background = c;
    s.addEventListener('click', function() { setColor(c); });
    cSwatches.appendChild(s);
  });

  function setColor(c) {
    cInput.value = c; cHex.value = c; cPrev.style.background = c;
  }
  cInput.addEventListener('input', function() { setColor(cInput.value); });
  cHex.addEventListener('input', function() {
    var v = cHex.value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(v);
  });
  q('#dt-ccopy').addEventListener('click', function() {
    navigator.clipboard.writeText(cHex.value).then(function() {
      var btn = q('#dt-ccopy'); btn.textContent = '✓ Copied!'; setTimeout(function() { btn.textContent = 'Copy'; }, 1200);
    });
  });

  if ('EyeDropper' in window) {
    var edBtn = q('#dt-ceyedrop');
    edBtn.style.display = '';
    edBtn.addEventListener('click', function() {
      new EyeDropper().open().then(function(result) { setColor(result.sRGBHex); });
    });
  }

  // Viewport
  function updateViewport() {
    var w = window.innerWidth, h = window.innerHeight;
    vpInfo.innerHTML = '<div><span style="color:#484f58">Inner:</span> ' + w + ' × ' + h + 'px</div>'
      + '<div><span style="color:#484f58">Outer:</span> ' + window.outerWidth + ' × ' + window.outerHeight + 'px</div>'
      + '<div><span style="color:#484f58">Ratio:</span> ' + (window.devicePixelRatio || 1) + 'x</div>'
      + '<div><span style="color:#484f58">Screen:</span> ' + screen.width + ' × ' + screen.height + 'px</div>';
    var scale = Math.min(140 / w, 80 / h, 1);
    vpBox.style.width = Math.round(w * scale) + 'px';
    vpBox.style.height = Math.round(h * scale) + 'px';
    vpBox.textContent = w + '×' + h;
  }
  window.addEventListener('resize', function() { if (state.open && state.tab === 'tools') updateViewport(); });

  // Storage
  function updateStorage() {
    var ls = 0, ss = 0;
    try { ls = Object.keys(localStorage).length; } catch(e) {}
    try { ss = Object.keys(sessionStorage).length; } catch(e) {}
    var ck = document.cookie ? document.cookie.split(';').length : 0;
    storInfo.innerHTML = 'localStorage: ' + ls + ' keys<br>sessionStorage: ' + ss + ' keys<br>Cookies: ' + ck + ' entries';
  }

  function clearStorage(type) {
    try {
      if (type === 'local' || type === 'all') localStorage.clear();
      if (type === 'session' || type === 'all') sessionStorage.clear();
      if (type === 'cookies' || type === 'all') {
        document.cookie.split(';').forEach(function(c) {
          document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        });
      }
    } catch(e) {}
    updateStorage();
  }
  q('#dt-clr-local').addEventListener('click', function() { clearStorage('local'); });
  q('#dt-clr-session').addEventListener('click', function() { clearStorage('session'); });
  q('#dt-clr-cookies').addEventListener('click', function() { clearStorage('cookies'); });
  q('#dt-clr-all').addEventListener('click', function() { clearStorage('all'); });

  // Screenshot
  q('#dt-screenshot').addEventListener('click', function() {
    if (typeof html2canvas !== 'undefined') {
      this.textContent = 'Capturing...';
      var btn = this;
      html2canvas(document.body).then(function(canvas) {
        var link = document.createElement('a');
        link.download = 'screenshot-' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.textContent = '✓ Saved!';
        setTimeout(function() { btn.textContent = 'Capture Screenshot'; }, 1500);
      }).catch(function() {
        btn.textContent = 'Capture Screenshot';
        alert('Screenshot failed');
      });
    } else {
      alert('Screenshot requires the html2canvas library.\\nAdd <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\\/script> to your page.');
    }
  });

  /* ===================== KEYBOARD ===================== */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && state.open) { closePanel(); e.preventDefault(); }
    if (e.ctrlKey && e.shiftKey && e.key === 'T') { e.preventDefault(); togglePanel(); }
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      if (!state.open) openPanel();
      switchTab('elements');
      if (!state.inspecting) startInspect();
    }
  });

  console.log('%c🔧 Dev Tools loaded', 'color:#7c5cfc;font-weight:bold;font-size:12px;', '- Click ⊕ or press Ctrl+Shift+T');
})();
`;

// ============================================================
// HTTP SERVER
// ============================================================
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url);

  if (url === '/' || url === '') {
    serveDashboard(res);
    return;
  }

  if (url === '/tools.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(TOOLS_SCRIPT);
    return;
  }

    // API: Return raw source file (for View Source tool)
    if (url.startsWith('/api/source?')) {
      const params = new URLSearchParams(url.split('?')[1]);
      const filePath = params.get('path');
      if (filePath) {
        // Strip leading "/" so path.join doesn't treat it as absolute
        let relativePath = filePath.replace(/^\//, '');
        relativePath = relativePath.replace(/^projects\//, '');
        const fullPath = path.join(__dirname, relativePath);
        const normalized = path.normalize(fullPath);
        if (normalized.startsWith(__dirname) && fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(fs.readFileSync(normalized, 'utf-8'));
          return;
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

  const match = url.match(/^\/projects\/(.+?)\/(.+)$/);
  if (match) {
    const folderName = match[1];
    const fileName = match[2];
    const fullPath = path.join(__dirname, folderName, fileName);
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
        let content = fs.readFileSync(fullPath);
        if (ext === '.html') {
          let html = content.toString();
          const toolsScript = `<script src="/tools.js"><\/script>`;
          html = html.replace(/<\/body>/i, toolsScript + '\n</body>');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        return;
      }
    } catch (err) {}
  }

  res.writeHead(404);
  res.end(`<h1>404 - Not Found</h1><p>${url}</p>`);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔧 Dev Tools: bottom panel on project pages (⊕ button or Ctrl+Shift+T)`);
  console.log(`🔍 Quick inspect: Ctrl+Shift+I`);
});