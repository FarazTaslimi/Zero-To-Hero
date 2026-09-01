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
  '.md': 'text/markdown',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function checkResponsive(folderPath) {
  const cssPath = path.join(folderPath, 'style.css');
  if (!fs.existsSync(cssPath)) return 'desktop';
  try {
    const css = fs.readFileSync(cssPath, 'utf-8');
    const has1024 = /@media\s*\([^)]*min-width\s*:\s*1024/i.test(css);
    const has768 = /@media\s*\([^)]*min-width\s*:\s*768/i.test(css);
    if (has1024) return 'all';
    if (has768) return 'mobile-tablet';
    return 'desktop';
  } catch (e) { return 'desktop'; }
}

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
      responsive: checkResponsive(fullPath),
      previewPath: hasPreview ? `/projects/${item}/preview.png` : null,
      indexPath: hasIndex ? `/projects/${item}/index.html` : null
    });
  }
  projects.sort((a, b) => a.number - b.number);
  return projects;
}

function deviceIcons(responsive) {
  const phone = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
  const tablet = '<svg width="15" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
  const laptop = '<svg width="16" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>';
  if (responsive === 'all') return `<span class="dev-icons">${phone}${tablet}${laptop}</span>`;
  if (responsive === 'mobile-tablet') return `<span class="dev-icons">${phone}${tablet}</span>`;
  return `<span class="dev-icons">${laptop}</span>`;
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
        <div class="card-content">
          <h3>${p.name}</h3>
          <div class="card-meta">
            <span class="project-number">#${p.number}</span>
            ${deviceIcons(p.responsive)}
          </div>
        </div>
      </div>
    `;
  }
  const html = `<!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Project Dashboard</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:#080b12;color:#e6edf3;min-height:100vh;overflow-x:hidden}
    body::before{content:'';position:fixed;top:-30%;left:-10%;width:50%;height:60%;background:radial-gradient(circle,rgba(88,166,255,.06) 0%,transparent 70%);pointer-events:none;z-index:0}
    body::after{content:'';position:fixed;bottom:-20%;right:-10%;width:45%;height:55%;background:radial-gradient(circle,rgba(240,136,62,.05) 0%,transparent 70%);pointer-events:none;z-index:0}
    .container{max-width:1200px;margin:0 auto;padding:50px 24px;position:relative;z-index:1}
    .header{margin-bottom:48px;text-align:center}
    .header h1{font-size:3rem;font-weight:800;letter-spacing:-1px;background:linear-gradient(135deg,#58a6ff 0%,#a78bfa 40%,#f0883e 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.2}
    .header p{color:#7d8590;font-size:1.05rem;margin-top:10px;font-weight:400}
    .header .stats{display:inline-flex;gap:16px;margin-top:16px;padding:8px 24px;background:rgba(22,27,34,.7);backdrop-filter:blur(12px);border-radius:24px;border:1px solid rgba(48,54,61,.6);font-size:.85rem;color:#7d8590}
    .header .stats span{color:#f0f6fc;font-weight:700}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:20px}
    .card{background:rgba(22,27,34,.6);backdrop-filter:blur(8px);border-radius:16px;border:1px solid rgba(48,54,61,.5);overflow:hidden;transition:all .35s cubic-bezier(.4,0,.2,1);cursor:pointer;position:relative}
    .card::before{content:'';position:absolute;inset:0;border-radius:16px;padding:1px;background:linear-gradient(135deg,transparent 40%,rgba(88,166,255,.3) 50%,rgba(167,139,250,.3) 60%,transparent 70%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .35s;pointer-events:none}
    .card:hover{transform:translateY(-6px);border-color:rgba(88,166,255,.25);box-shadow:0 16px 48px rgba(0,0,0,.4),0 0 0 1px rgba(88,166,255,.1)}
    .card:hover::before{opacity:1}
    .card-image{width:100%;aspect-ratio:16/9;background:#0d1117;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .card-image img{width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.4,0,.2,1)}
    .card:hover .card-image img{transform:scale(1.04)}
    .no-preview{display:flex;flex-direction:column;align-items:center;justify-content:center;color:#21262d;font-size:2.5rem;height:100%;width:100%;gap:6px}
    .no-preview span{font-size:.78rem;color:#30363d}
    .card-content{padding:16px 18px 18px;display:flex;flex-direction:column;gap:10px}
    .card-content h3{font-size:.95rem;font-weight:600;color:#f0f6fc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .card-meta{display:flex;align-items:center;justify-content:space-between}
    .project-number{font-size:.68rem;font-weight:600;color:#8b949e;background:rgba(13,17,23,.8);padding:3px 10px;border-radius:10px;border:1px solid rgba(48,54,61,.6);letter-spacing:.3px}
    .dev-icons{display:flex;gap:5px;color:#484f58;align-items:center}
    .dev-icons svg{opacity:.7;transition:opacity .2s}
    .card:hover .dev-icons svg{opacity:1;color:#7d8590}
    .empty-state{text-align:center;padding:100px 24px;color:#7d8590}
    .empty-state .emoji{font-size:4rem;display:block;margin-bottom:16px;opacity:.5}
    .empty-state h2{font-size:1.4rem;color:#f0f6fc;margin-bottom:8px;font-weight:600}
    .empty-state p{font-size:.95rem;color:#7d8590}
    .empty-state code{background:rgba(22,27,34,.8);padding:2px 8px;border-radius:4px;font-size:.85rem;border:1px solid rgba(48,54,61,.5)}
    @media(max-width:640px){.header h1{font-size:2.2rem}.grid{grid-template-columns:1fr;gap:14px}.container{padding:30px 16px}}
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Project Dashboard</h1>
        <p>Your learning journey, one project at a time</p>
        <div class="stats">📦 <span>${projects.length}</span> projects &nbsp;·&nbsp; 🖼️ <span>${previewCount}</span> with previews</div>
      </div>
      ${projects.length > 0 ? `<div class="grid">${cardsHtml}</div>` : `
        <div class="empty-state"><span class="emoji">📭</span><h2>No projects found</h2><p>Create folders matching: <code>#. project-name</code></p><p style="margin-top:8px;font-size:.82rem;color:#484f58;">Example: <code>1. google-clone</code>, <code>2. weather-app</code></p></div>
      `}
    </div>
  </body>
  </html>`;
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

// ============================================================
// 🛠️ DEV TOOLS – Modern Bottom Panel
// ============================================================
const TOOLS_SCRIPT = `
(function() {
  'use strict';
  if (window.__dt_init) return;
  window.__dt_init = true;

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
    _fpsTime: performance.now(),
    interceptedUrls: {},
    perfSeen: new Set(),
    respOpen: false,
    respDevice: null
  };

  var q = function(sel, ctx) { return (ctx || document).querySelector(sel); };
  var qa = function(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); };
  var esc = function(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

  function formatObj(v) {
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (typeof v === 'object') { try { return JSON.stringify(v, null, 2); } catch(e) { return String(v); } }
    return String(v);
  }

  function getBreadcrumb(el) {
    var parts = [], cur = el;
    while (cur && cur !== document) {
      var s = cur.tagName.toLowerCase();
      if (cur.id) s += '#' + cur.id;
      else if (cur.className && typeof cur.className === 'string') { var c = cur.className.trim().split(/\\s+/).slice(0,2).join('.'); if (c) s += '.' + c; }
      parts.unshift(s);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  function getUsefulStyles(el) {
    var cs = getComputedStyle(el);
    var props = ['display','position','width','height','margin','padding','color','background-color','font-size','font-weight','line-height','border','border-radius','box-shadow','opacity','overflow','flex-direction','justify-content','align-items','gap','transform'];
    var out = [];
    for (var i = 0; i < props.length; i++) {
      var val = cs.getPropertyValue(props[i]);
      if (val && val !== 'none' && val !== '0px' && val !== 'normal' && val !== 'medium' && val !== 'visible' && val !== 'auto' && val !== '0s' && val !== 'ease' && val !== 'matrix(none)') {
        out.push({ prop: props[i], val: val });
      }
    }
    return out;
  }

  function highlightHTML(raw) {
    var ph = [];
    var result = raw.replace(/&lt;!--[\s\S]*?--&gt;/g, function(m) {
      ph.push('<span class="sh-cmt">' + m + '</span>');
      return '\\x00' + (ph.length - 1) + '\\x00';
    }).replace(/&lt;!DOCTYPE[\s\S]*?&gt;/gi, function(m) {
      ph.push('<span class="sh-doc">' + m + '</span>');
      return '\\x00' + (ph.length - 1) + '\\x00';
    });
    result = result.replace(/&lt;(\\/?)([\\w-]+)((?:\\s+[\\w\\-:@.]+(?:\\s*=\\s*(?:"[^"]*"|'[^']*'))?)*)\\s*(\\/?)\\s*&gt;/g, function(match, slash, tagName, attrs, selfClose) {
      var html = '&lt;' + slash + '<span class="sh-tag">' + tagName + '</span>';
      if (attrs) {
        html += attrs.replace(/ ([\\w\\-:@.]+)(\\s*=\\s*)("([^"]*)"|'([^']*)')/g,
        ' <span class="sh-attr">$1</span>$2<span class="sh-val">$3</span>');
      }
      html += selfClose + '&gt;';
      return html;
    });
    for (var i = 0; i < ph.length; i++) {
      result = result.replace('\\x00' + i + '\\x00', ph[i]);
    }
    return result;
  }

  /* ===================== CSS ===================== */
  var styleEl = document.createElement('style');
  styleEl.textContent = \`
    .dt-fab{position:fixed;bottom:24px;left:24px;width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#7c5cfc,#5a3fd4);border:none;color:#fff;font-size:20px;cursor:pointer;box-shadow:0 4px 24px rgba(124,92,252,.45);z-index:999999;display:flex;align-items:center;justify-content:center;transition:all .25s cubic-bezier(.4,0,.2,1);user-select:none;line-height:1}
    .dt-fab:hover{transform:translateY(-2px) scale(1.08);box-shadow:0 8px 32px rgba(124,92,252,.55)}
    .dt-fab.active{background:linear-gradient(135deg,#5a3fd4,#4832b0)}
    .dt-fab.hide{transform:scale(0);opacity:0;pointer-events:none}
    .dt-panel{position:fixed;bottom:0;left:0;right:0;height:38vh;min-height:220px;max-height:85vh;background:#0d1117;border-top:1px solid #21262d;z-index:999998;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;transform:translateY(100%);transition:transform .3s cubic-bezier(.4,0,.2,1)}
    .dt-panel *{font-size:inherit}
    .dt-panel.open{transform:translateY(0)}
    .dt-resizer{height:5px;cursor:ns-resize;flex-shrink:0;position:relative}
    .dt-resizer::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48px;height:3px;background:#30363d;border-radius:3px;transition:background .15s}
    .dt-resizer:hover::after,.dt-resizer.active::after{background:#7c5cfc;width:64px}
    .dt-tabbar{display:flex;align-items:center;background:#161b22;border-bottom:1px solid #21262d;padding:0 6px;flex-shrink:0;overflow-x:auto;gap:1px}
    .dt-tabbar::-webkit-scrollbar{height:0}
    .dt-dash-link{padding:7px 12px;color:#6e7681;font-size:12px;text-decoration:none;white-space:nowrap;transition:color .15s;flex-shrink:0;border-right:1px solid #21262d;margin-right:4px}
    .dt-dash-link:hover{color:#7c5cfc}
    .dt-tab{padding:8px 14px;background:none;border:none;border-bottom:2px solid transparent;color:#8b949e;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:all .15s;font-family:inherit;display:flex;align-items:center;gap:6px}
    .dt-tab:hover{color:#e6edf3;background:rgba(255,255,255,.03)}
    .dt-tab.active{color:#e6edf3;border-bottom-color:#7c5cfc}
    .dt-badge{background:#f85149;color:#fff;font-size:10px;padding:0 5px;border-radius:8px;min-width:16px;text-align:center;line-height:16px;display:none;font-weight:600}
    .dt-badge.show{display:inline-block}
    .dt-spacer{flex:1}
    .dt-hdr-btn{background:none;border:1px solid #30363d;border-radius:6px;color:#8b949e;cursor:pointer;padding:4px 10px;font-size:13px;transition:all .15s;display:flex;align-items:center;gap:4px;white-space:nowrap;font-family:inherit}
    .dt-hdr-btn:hover{color:#e6edf3;border-color:#484f58;background:rgba(255,255,255,.03)}
    .dt-hdr-btn.active{color:#7c5cfc;border-color:#7c5cfc;background:rgba(124,92,252,.08)}
    .dt-close{background:none;border:none;color:#6e7681;cursor:pointer;padding:6px 10px;font-size:16px;border-radius:6px;transition:all .15s;line-height:1}
    .dt-close:hover{color:#f0f6fc;background:rgba(255,255,255,.06)}
    .dt-content{flex:1;overflow:hidden;position:relative}
    .dt-pane{position:absolute;inset:0;overflow:auto;display:none;flex-direction:column;padding:12px}
    .dt-pane.active{display:flex}
    .dt-pane::-webkit-scrollbar{width:5px;height:5px}
    .dt-pane::-webkit-scrollbar-track{background:transparent}
    .dt-pane::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px}
    .dt-bar{display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-shrink:0;flex-wrap:wrap}
    .dt-btn{padding:5px 12px;background:#21262d;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;font-size:12px;cursor:pointer;transition:all .15s;font-family:inherit;white-space:nowrap}
    .dt-btn:hover{background:#30363d;border-color:#484f58;color:#f0f6fc}
    .dt-btn.primary{background:#7c5cfc;border-color:#7c5cfc;color:#fff}
    .dt-btn.primary:hover{background:#6b4fe0}
    .dt-btn.danger{background:rgba(248,81,73,.1);border-color:rgba(248,81,73,.25);color:#f85149}
    .dt-btn.danger:hover{background:rgba(248,81,73,.2)}
    .dt-btn.active{background:#7c5cfc;border-color:#7c5cfc;color:#fff}
    .dt-breadcrumb{color:#8b949e;font-size:12px;font-family:"SF Mono",Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
    .dt-breadcrumb b{color:#7c5cfc;font-weight:500}
    .dt-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#30363d;text-align:center;gap:6px;user-select:none}
    .dt-empty .ico{font-size:2.2rem;opacity:.5}
    .dt-empty .txt{font-size:13px;color:#6e7681}
    .dt-empty .sub{font-size:12px;color:#30363d}
    .dt-detail-section{margin-bottom:14px}
    .dt-label{color:#6e7681;font-size:11px;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;font-weight:600}
    .dt-code{color:#c9d1d9;background:#161b22;padding:10px 12px;border-radius:8px;border:1px solid #21262d;font-family:"SF Mono",Consolas,monospace;font-size:12px;word-break:break-all;line-height:1.65;overflow:auto;max-height:200px;white-space:pre-wrap}
    .dt-code .t{color:#7ee787}.dt-code .a{color:#d2a8ff}.dt-code .v{color:#a5d6ff}.dt-code .p{color:#79c0ff}.dt-code .s{color:#ffa657}
    .dt-style-row{display:flex;gap:8px;padding:2px 0;font-family:"SF Mono",Consolas,monospace;font-size:12px}
    .dt-style-row .p{color:#79c0ff;flex-shrink:0;min-width:120px}
    .dt-style-row .v{color:#c9d1d9;word-break:break-all}
    .dt-entries{flex:1;overflow:auto;font-family:"SF Mono",Consolas,monospace;font-size:12px;background:#0a0d12;border-radius:8px;border:1px solid #21262d}
    .dt-entry{padding:4px 10px;border-bottom:1px solid #161b22;display:flex;align-items:flex-start;gap:8px;line-height:1.5}
    .dt-entry:hover{background:rgba(255,255,255,.015)}
    .dt-entry.log{color:#e6edf3}.dt-entry.error{color:#f85149;background:rgba(248,81,73,.05)}.dt-entry.warn{color:#d29922;background:rgba(210,153,34,.05)}.dt-entry.info{color:#58a6ff}.dt-entry.result{color:#8b949e;font-style:italic}
    .dt-time{color:#3d444d;font-size:11px;flex-shrink:0;padding-top:2px}
    .dt-msg{word-break:break-word;flex:1;white-space:pre-wrap}
    .dt-input-row{display:flex;gap:6px;margin-top:8px;flex-shrink:0}
    .dt-input{flex:1;padding:7px 10px;background:#0a0d12;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font-family:"SF Mono",Consolas,monospace;font-size:12px;outline:none}
    .dt-input:focus{border-color:#7c5cfc}
    .dt-table{width:100%;border-collapse:collapse;font-size:12px;font-family:"SF Mono",Consolas,monospace}
    .dt-table th{text-align:left;padding:6px 10px;color:#8b949e;font-weight:500;border-bottom:1px solid #30363d;position:sticky;top:0;background:#0d1117;z-index:1}
    .dt-table td{padding:4px 10px;border-bottom:1px solid #161b22;color:#c9d1d9;max-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dt-table tr:hover td{background:rgba(255,255,255,.015)}
    .dt-s-ok{color:#3fb950}.dt-s-warn{color:#d29922}.dt-s-err{color:#f85149}.dt-meth{color:#7c5cfc}
    .dt-type{color:#6e7681;font-size:11px}
    .dt-src-wrap{flex:1;overflow:auto;background:#0a0d12;border-radius:8px;border:1px solid #21262d;position:relative}
    .dt-src-code{display:flex;font-family:"SF Mono",Consolas,monospace;font-size:12px;line-height:1.7;min-height:100%}
    .dt-src-lines{padding:10px 0;text-align:right;color:#21262d;user-select:none;border-right:1px solid #21262d;flex-shrink:0;min-width:44px}
    .dt-src-lines div{padding:0 10px}
    .dt-src-text{padding:10px 12px;color:#c9d1d9;white-space:pre;flex:1;overflow-x:auto;tab-size:2}
    .sh-tag{color:#7ee787}.sh-attr{color:#d2a8ff}.sh-val{color:#a5d6ff}.sh-cmt{color:#6e7681;font-style:italic}.sh-doc{color:#6e7681;font-style:italic}
    .dt-perf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
    .dt-perf-card{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:14px 16px}
    .dt-perf-card .lbl{color:#8b949e;font-size:11px;margin-bottom:4px}
    .dt-perf-card .val{color:#e6edf3;font-size:1.3rem;font-weight:700;font-family:"SF Mono",Consolas,monospace}
    .dt-perf-card .val.acc{color:#7c5cfc}.dt-perf-card .val.grn{color:#3fb950}.dt-perf-card .val.red{color:#f85149}
    .dt-perf-card .sub{color:#3d444d;font-size:11px;margin-top:2px}
    .dt-tools-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
    .dt-tool-card{background:#161b22;border:1px solid #21262d;border-radius:12px;padding:16px;transition:border-color .15s}
    .dt-tool-card:hover{border-color:#30363d}
    .dt-tool-card h4{color:#e6edf3;font-size:13px;margin-bottom:6px;font-weight:600}
    .dt-tool-card p{color:#8b949e;font-size:12px;margin-bottom:10px;line-height:1.45}
    .dt-color-row{display:flex;gap:8px;align-items:center}
    .dt-color-swatch{width:36px;height:36px;border-radius:8px;border:2px solid #30363d;flex-shrink:0;transition:border-color .15s}
    .dt-color-input{width:42px;height:36px;border:none;border-radius:6px;cursor:pointer;background:none;padding:0}
    .dt-color-hex{flex:1;padding:7px 10px;background:#0a0d12;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font-family:"SF Mono",Consolas,monospace;font-size:12px;outline:none}
    .dt-color-hex:focus{border-color:#7c5cfc}
    .dt-colors{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
    .dt-csw{width:26px;height:26px;border-radius:6px;border:2px solid transparent;cursor:pointer;transition:all .15s}
    .dt-csw:hover{transform:scale(1.15);border-color:rgba(255,255,255,.25)}
    .dt-vp-vis{display:flex;align-items:center;justify-content:center;padding:20px;background:#0a0d12;border-radius:8px;border:1px solid #21262d;margin-top:8px}
    .dt-vp-box{border:2px solid #7c5cfc;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#7c5cfc;font-family:"SF Mono",Consolas,monospace;font-size:12px;transition:all .3s}
    .dt-ls-table{width:100%;border-collapse:collapse;font-size:12px;font-family:"SF Mono",Consolas,monospace;margin-bottom:8px}
    .dt-ls-table th{text-align:left;padding:4px 8px;color:#6e7681;font-weight:500;border-bottom:1px solid #21262d;font-size:11px}
    .dt-ls-table td{padding:4px 8px;border-bottom:1px solid #161b22;color:#c9d1d9;max-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dt-ls-table tr:hover td{background:rgba(255,255,255,.02)}
    .dt-ls-actions{display:flex;gap:4px}
    .dt-ls-actions button{background:none;border:none;color:#6e7681;cursor:pointer;padding:2px 4px;font-size:14px;border-radius:3px;transition:all .15s}
    .dt-ls-actions button:hover{color:#f0f6fc;background:rgba(255,255,255,.06)}
    .dt-ls-actions button.del:hover{color:#f85149}
    .dt-highlight{position:fixed;pointer-events:none;z-index:999997;display:none;border:2px solid #7c5cfc;background:rgba(124,92,252,.07);transition:top .05s,left .05s,width .05s,height .05s}
    .dt-highlight-label{position:absolute;top:-20px;left:0;background:#7c5cfc;color:#fff;font-size:11px;padding:1px 6px;border-radius:3px;font-family:"SF Mono",Consolas,monospace;white-space:nowrap}
    body.dt-inspect{cursor:crosshair!important}
    body.dt-inspect *{cursor:crosshair!important}
    .dt-resp-overlay{position:fixed;inset:0;background:#080b12;z-index:9999999;display:none;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px}
    .dt-resp-overlay *{font-size:inherit}
    .dt-resp-overlay.open{display:flex}
    .dt-resp-toolbar{display:flex;align-items:center;gap:8px;padding:10px 16px;background:#161b22;border-bottom:1px solid #21262d;flex-shrink:0;overflow-x:auto}
    .dt-resp-toolbar::-webkit-scrollbar{height:0}
    .dt-resp-dev{padding:6px 14px;background:#21262d;border:1px solid #30363d;border-radius:8px;color:#8b949e;font-size:12px;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:inherit}
    .dt-resp-dev:hover{background:#30363d;color:#e6edf3}
    .dt-resp-dev.active{background:#7c5cfc;border-color:#7c5cfc;color:#fff}
    .dt-resp-size{color:#6e7681;font-size:12px;font-family:"SF Mono",Consolas,monospace;white-space:nowrap}
    .dt-resp-nums{display:flex;gap:6px;align-items:center}
    .dt-resp-nums input{width:60px;padding:4px 8px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font-family:"SF Mono",Consolas,monospace;font-size:12px;outline:none;text-align:center}
    .dt-resp-nums input:focus{border-color:#7c5cfc}
    .dt-resp-nums span{color:#6e7681;font-size:12px}
    .dt-resp-body{flex:1;display:flex;align-items:center;justify-content:center;padding:24px;overflow:hidden;position:relative}
    .dt-resp-frame-wrap{position:relative;transition:all .3s cubic-bezier(.4,0,.2,1);box-shadow:0 0 0 1px #30363d,0 20px 60px rgba(0,0,0,.5);border-radius:8px;overflow:hidden;background:#fff}
    .dt-resp-frame{display:block;border:none;width:100%;height:100%;background:#fff}
    .dt-resp-dim{position:absolute;bottom:-28px;left:50%;transform:translateX(-50%);color:#6e7681;font-size:12px;font-family:"SF Mono",Consolas,monospace;white-space:nowrap}
    .dt-page-info-row{display:flex;justify-content:space-between;padding:3px 0;font-size:12px;border-bottom:1px solid #161b22}
    .dt-page-info-row .pk{color:#6e7681;flex-shrink:0;max-width:40%}
    .dt-page-info-row .pv{color:#c9d1d9;word-break:break-all;text-align:right;flex:1;margin-left:12px}
    @media(max-width:640px){.dt-panel{height:55vh}.dt-tab{padding:7px 10px;font-size:12px}.dt-tools-grid{grid-template-columns:1fr}}
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
      <button class="dt-hdr-btn" id="dt-resp-btn" title="Responsive View">📱</button>
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
          <span style="color:#6e7681;font-size:12px" id="dt-con-count"></span>
        </div>
        <div class="dt-entries" id="dt-con-out"></div>
        <div class="dt-input-row">
          <input class="dt-input" id="dt-con-in" placeholder="Evaluate expression..." autocomplete="off" spellcheck="false">
          <button class="dt-btn primary" id="dt-con-run">Run</button>
        </div>
      </div>
      <div class="dt-pane" data-p="network">
        <div class="dt-bar">
          <button class="dt-btn" id="dt-clear-net">Clear</button>
          <span style="color:#6e7681;font-size:12px" id="dt-net-count"></span>
        </div>
        <div style="flex:1;overflow:auto;border-radius:8px;border:1px solid #21262d" id="dt-net-wrap">
          <table class="dt-table"><thead><tr><th>Method</th><th>Type</th><th>URL</th><th>Status</th><th>Time</th></tr></thead><tbody id="dt-net-body"></tbody></table>
          <div class="dt-empty" id="dt-net-empty"><div class="ico">🌐</div><div class="txt">Network requests will appear here</div></div>
        </div>
      </div>
      <div class="dt-pane" data-p="sources">
        <div class="dt-bar">
          <button class="dt-btn" id="dt-src-copy">📋 Copy</button>
          <span style="color:#6e7681;font-size:12px" id="dt-src-name"></span>
        </div>
        <div class="dt-src-wrap" id="dt-src-wrap"><div class="dt-empty"><div class="ico">📄</div><div class="txt">Loading source...</div></div></div>
      </div>
      <div class="dt-pane" data-p="performance">
        <div class="dt-perf-grid" id="dt-perf-grid"></div>
      </div>
      <div class="dt-pane" data-p="tools">
        <div class="dt-tools-grid" id="dt-tools-grid"></div>
      </div>
    </div>
  \`;
  document.body.appendChild(panel);

  /* ===================== RESPONSIVE OVERLAY ===================== */
  var respOverlay = document.createElement('div');
  respOverlay.className = 'dt-resp-overlay';
  var devices = [
    {name:'iPhone SE',w:375,h:667},{name:'iPhone 14',w:390,h:844},{name:'iPhone 14 Pro',w:430,h:932},
    {name:'iPad Mini',w:768,h:1024},{name:'iPad Pro',w:1024,h:1366},
    {name:'Laptop',w:1366,h:768},{name:'Desktop',w:1920,h:1080},{name:'Full',w:0,h:0}
  ];
  var devBtns = devices.map(function(d,i){return '<button class="dt-resp-dev'+(i===0?' active':'')+'" data-i="'+i+'">'+d.name+'</button>';}).join('');
  respOverlay.innerHTML = \`
    <div class="dt-resp-toolbar">
      \${devBtns}
      <div class="dt-spacer"></div>
      <div class="dt-resp-nums"><input type="number" id="dt-rw" value="375" min="0"><span>×</span><input type="number" id="dt-rh" value="667" min="0"><span>px</span></div>
      <button class="dt-btn" id="dt-resp-rotate">↻ Rotate</button>
      <button class="dt-hdr-btn" id="dt-resp-close">✕ Close</button>
    </div>
    <div class="dt-resp-body">
      <div class="dt-resp-frame-wrap" id="dt-resp-frame-wrap" style="width:375px;height:667px">
        <iframe class="dt-resp-frame" id="dt-resp-frame"></iframe>
        <div class="dt-resp-dim" id="dt-resp-dim">375 × 667</div>
      </div>
    </div>
  \`;
  document.body.appendChild(respOverlay);

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
  var toolsGrid = q('#dt-tools-grid');
  var respBtn = q('#dt-resp-btn');
  var respFrame = q('#dt-resp-frame');
  var respFrameWrap = q('#dt-resp-frame-wrap');
  var respDim = q('#dt-resp-dim');
  var rwInput = q('#dt-rw');
  var rhInput = q('#dt-rh');

  /* ===================== PANEL LOGIC ===================== */
  function openPanel() {
    state.open = true;
    panel.classList.add('open');
    fab.classList.add('active');
    if (state.tab === 'sources') loadSource();
    if (state.tab === 'performance') updatePerf();
    if (state.tab === 'console') renderAllLogs();
    if (state.tab === 'tools') { updateViewport(); updateStorage(); updatePageInfo(); }
    startFps();
    startNetPoll();
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
    if (name === 'console') renderAllLogs();
    if (name === 'tools') { updateViewport(); updateStorage(); updatePageInfo(); }
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
    panel.style.height = Math.min(Math.max(resizeH + (resizeY - e.clientY), 220), window.innerHeight * 0.85) + 'px';
  });
  document.addEventListener('mouseup', function() {
    if (resizing) { resizing = false; resizer.classList.remove('active'); document.body.style.cursor = ''; document.body.style.userSelect = ''; }
  });

  /* ===================== ELEMENTS ===================== */
  function isToolEl(el) { return el.closest && (el.closest('.dt-panel') || el.closest('.dt-fab') || el.closest('.dt-highlight') || el.closest('.dt-resp-overlay')); }
  function updateHighlight(el) {
    if (!el || isToolEl(el)) { highlight.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    highlight.style.display = 'block';
    highlight.style.top = r.top + 'px'; highlight.style.left = r.left + 'px';
    highlight.style.width = r.width + 'px'; highlight.style.height = r.height + 'px';
    var tag = el.tagName.toLowerCase();
    var id = el.id ? '#' + el.id : '';
    hlLabel.textContent = tag + id;
  }
  function startInspect() { state.inspecting = true; pickBtn.classList.add('active'); pickBtn.textContent = '⏹ Stop'; document.body.classList.add('dt-inspect'); }
  function stopInspect() { state.inspecting = false; pickBtn.classList.remove('active'); pickBtn.textContent = '⬚ Pick Element'; document.body.classList.remove('dt-inspect'); highlight.style.display = 'none'; }
  pickBtn.addEventListener('click', function() { state.inspecting ? stopInspect() : startInspect(); });
  document.addEventListener('mouseover', function(e) { if (state.inspecting && state.open) updateHighlight(e.target); });
  document.addEventListener('click', function(e) {
    if (!state.inspecting || !state.open || isToolEl(e.target)) return;
    e.preventDefault(); e.stopPropagation();
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
    elDetails.innerHTML = '<div class="dt-detail-section"><div class="dt-label">Element</div><div class="dt-code"><span class="t">&lt;' + tag + id + cls + attrs + '&gt;</span></div></div>'
      + '<div class="dt-detail-section"><div class="dt-label">Dimensions &amp; Position</div><div class="dt-code"><span class="p">width:</span> <span class="v">' + el.offsetWidth + 'px</span>  <span class="p">height:</span> <span class="v">' + el.offsetHeight + 'px</span>\\n<span class="p">offsetTop:</span> <span class="v">' + el.offsetTop + 'px</span>  <span class="p">offsetLeft:</span> <span class="v">' + el.offsetLeft + 'px</span>\\n<span class="p">children:</span> <span class="v">' + el.children.length + '</span>  <span class="p">text:</span> <span class="v">' + esc(el.textContent.slice(0,80)) + (el.textContent.length > 80 ? '...' : '') + '</span></div></div>'
      + '<div class="dt-detail-section"><div class="dt-label">Computed Styles</div><div style="background:#161b22;border-radius:8px;border:1px solid #21262d;padding:6px 10px;overflow:auto;max-height:180px">' + (stylesHtml || '<span style="color:#3d444d">No notable styles</span>') + '</div></div>'
      + '<div class="dt-detail-section"><div class="dt-label">HTML</div><div class="dt-code">' + htmlSrc + '</div></div>';
  }

  /* ===================== CONSOLE ===================== */
  var origLog = console.log, origError = console.error, origWarn = console.warn, origInfo = console.info;
  function timeStr() { var d = new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0')+'.'+String(d.getMilliseconds()).padStart(3,'0'); }
  function addLog(type, args) {
    var entry = { type: type, msg: args.map(formatObj).join(' '), time: timeStr() };
    state.logs.push(entry);
    if (type === 'error') { state.errorCount++; updateBadge(cBadge, state.errorCount); }
    if (type === 'warn') state.warnCount++;
    if (state.open && state.tab === 'console') renderLogEntry(entry);
    conCount.textContent = state.logs.length + ' entries';
  }
  function renderLogEntry(e) {
    var emptyEl = q('.dt-empty', conOut);
    if (emptyEl) conOut.innerHTML = '';
    var div = document.createElement('div');
    div.className = 'dt-entry ' + e.type;
    div.innerHTML = '<span class="dt-time">' + e.time + '</span><span class="dt-msg">' + esc(e.msg) + '</span>';
    conOut.appendChild(div);
    conOut.scrollTop = conOut.scrollHeight;
  }
  function renderAllLogs() {
    conOut.innerHTML = '';
    if (state.logs.length === 0) { conOut.innerHTML = '<div class="dt-empty"><div class="ico">📋</div><div class="txt">Console output will appear here</div></div>'; return; }
    state.logs.forEach(renderLogEntry);
  }
  function updateBadge(el, count) { if (count > 0) { el.textContent = count; el.classList.add('show'); } else el.classList.remove('show'); }

  console.log = function() { addLog('log', Array.from(arguments)); origLog.apply(console, arguments); };
  console.error = function() { addLog('error', Array.from(arguments)); origError.apply(console, arguments); };
  console.warn = function() { addLog('warn', Array.from(arguments)); origWarn.apply(console, arguments); };
  console.info = function() { addLog('info', Array.from(arguments)); origInfo.apply(console, arguments); };

  window.addEventListener('error', function(e) { addLog('error', ['Uncaught: ' + (e.message || e) + ' at ' + (e.filename || '') + ':' + (e.lineno || '')]); });
  window.addEventListener('unhandledrejection', function(e) { addLog('error', ['Unhandled Promise: ' + (e.reason && e.reason.message || e.reason || 'Unknown')]); });

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
      } else { addLog('result', ['← ' + formatObj(result)]); }
    } catch(e) { addLog('error', [e.message]); }
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
    state.interceptedUrls[url] = { method: method, pending: true, start: start };
    return origFetch.apply(this, arguments).then(function(res) {
      var info = state.interceptedUrls[url];
      if (info) { info.status = res.status; info.duration = Math.round(performance.now() - info.start); info.pending = false; addNetFromIntercept(url, info); }
      return res;
    }).catch(function(err) {
      var info = state.interceptedUrls[url];
      if (info) { info.status = 'ERR'; info.duration = Math.round(performance.now() - info.start); info.pending = false; addNetFromIntercept(url, info); }
      throw err;
    });
  };
  var origXhrOpen = XMLHttpRequest.prototype.open;
  var origXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) { this._dt_m = method; this._dt_u = url; this._dt_s = performance.now(); return origXhrOpen.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function() {
    var xhr = this; state.interceptedUrls[xhr._dt_u] = { method: xhr._dt_m, pending: true, start: xhr._dt_s };
    xhr.addEventListener('load', function() { var info = state.interceptedUrls[xhr._dt_u]; if (info) { info.status = xhr.status; info.duration = Math.round(performance.now() - info.start); info.pending = false; addNetFromIntercept(xhr._dt_u, info); } });
    xhr.addEventListener('error', function() { var info = state.interceptedUrls[xhr._dt_u]; if (info) { info.status = 'ERR'; info.duration = Math.round(performance.now() - info.start); info.pending = false; addNetFromIntercept(xhr._dt_u, info); } });
    return origXhrSend.apply(this, arguments);
  };

  function addNetFromIntercept(url, info) {
    if (info._added) return; info._added = true;
    addNetRow({ method: info.method, type: url.includes('/api/') ? 'xhr' : 'fetch', url: url, status: info.status, duration: info.duration });
  }

  var netPollId = null;
  function startNetPoll() {
    if (netPollId) return;
    netPollId = setInterval(function() {
      if (!state.open || state.tab !== 'network') return;
      var entries = performance.getEntriesByType('resource');
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var key = e.name;
        if (state.perfSeen.has(key)) continue;
        if (state.interceptedUrls[key]) continue;
        if (key.includes('/tools.js') || key.includes('/api/source')) continue;
        state.perfSeen.add(key);
        addNetRow({ method: 'GET', type: e.initiatorType, url: e.name, status: 200, duration: Math.round(e.duration) });
      }
    }, 400);
  }

  function addNetRow(r) {
    state.requests.push(r);
    if (netEmpty.style.display !== 'none') netEmpty.style.display = 'none';
    var sc = (typeof r.status === 'number') ? (r.status >= 200 && r.status < 300 ? 'dt-s-ok' : r.status >= 300 && r.status < 400 ? 'dt-s-warn' : 'dt-s-err') : 'dt-s-err';
    var shortUrl = r.url.split('/').pop() || r.url;
    if (shortUrl.length > 40) shortUrl = shortUrl.slice(0, 37) + '...';
    var tr = document.createElement('tr');
    tr.title = r.url;
    tr.innerHTML = '<td class="dt-meth">' + esc(r.method) + '</td><td class="dt-type">' + esc(r.type) + '</td><td>' + esc(shortUrl) + '</td><td class="' + sc + '">' + r.status + '</td><td>' + r.duration + 'ms</td>';
    netBody.appendChild(tr);
    netCount.textContent = state.requests.length + ' requests';
    updateBadge(nBadge, state.requests.length);
  }

  q('#dt-clear-net').addEventListener('click', function() {
    state.requests = []; state.perfSeen.clear(); state.interceptedUrls = {};
    netBody.innerHTML = ''; netEmpty.style.display = ''; netCount.textContent = '';
    updateBadge(nBadge, 0);
  });

  /* ===================== SOURCES ===================== */
  var sourceLoaded = false;
  function loadSource() {
    if (sourceLoaded) return;
    sourceLoaded = true;
    srcName.textContent = window.location.pathname;
    fetch('/api/source?path=' + window.location.pathname).then(function(r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function(src) {
      var lines = src.split('\\n');
      var lineHtml = lines.map(function(_, i) { return '<div>' + (i + 1) + '</div>'; }).join('');
      var highlighted = highlightHTML(esc(src));
      srcWrap.innerHTML = '<div class="dt-src-code"><div class="dt-src-lines">' + lineHtml + '</div><div class="dt-src-text">' + highlighted + '</div></div>';
    }).catch(function(err) {
      sourceLoaded = false;
      srcWrap.innerHTML = '<div class="dt-empty"><div class="ico">⚠</div><div class="txt">Could not load source</div><div class="sub">' + esc(err.message || 'Unknown error') + '</div></div>';
    });
  }
  q('#dt-src-copy').addEventListener('click', function() {
    var codeEl = q('.dt-src-text', srcWrap);
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent).then(function() {
        var btn = q('#dt-src-copy'); btn.textContent = '✓ Copied!'; setTimeout(function() { btn.textContent = '📋 Copy'; }, 1500);
      });
    }
  });

  /* ===================== PERFORMANCE ===================== */
  function updatePerf() {
    var nav = performance.getEntriesByType('navigation')[0];
    var mem = performance.memory;
    var domCount = document.querySelectorAll('*').length;
    var loadTime = nav ? (nav.loadEventEnd - nav.startTime) : 0;
    var domReady = nav ? (nav.domContentLoadedEventEnd - nav.startTime) : 0;
    perfGrid.innerHTML = '<div class="dt-perf-card"><div class="lbl">DOM Nodes</div><div class="val">' + domCount + '</div><div class="sub">Elements on page</div></div>'
      + '<div class="dt-perf-card"><div class="lbl">FPS</div><div class="val ' + (state.fps >= 50 ? 'grn' : state.fps >= 30 ? '' : 'red') + '">' + state.fps + '</div><div class="sub">Frames per second</div></div>'
      + '<div class="dt-perf-card"><div class="lbl">Load Time</div><div class="val ' + (loadTime < 1000 ? 'grn' : loadTime < 3000 ? '' : 'red') + '">' + (loadTime ? loadTime.toFixed(0) + 'ms' : 'N/A') + '</div><div class="sub">Page fully loaded</div></div>'
      + '<div class="dt-perf-card"><div class="lbl">DOM Ready</div><div class="val acc">' + (domReady ? domReady.toFixed(0) + 'ms' : 'N/A') + '</div><div class="sub">DOM parsed</div></div>'
      + '<div class="dt-perf-card"><div class="lbl">Scripts</div><div class="val">' + document.scripts.length + '</div><div class="sub">&lt;script&gt; tags</div></div>'
      + '<div class="dt-perf-card"><div class="lbl">Images</div><div class="val">' + document.images.length + '</div><div class="sub">&lt;img&gt; tags</div></div>'
      + (mem ? '<div class="dt-perf-card"><div class="lbl">JS Heap</div><div class="val">' + (mem.usedJSHeapSize / 1048576).toFixed(1) + 'MB</div><div class="sub">of ' + (mem.jsHeapSizeLimit / 1048576).toFixed(0) + 'MB</div></div>' : '');
  }
  var fpsId = null;
  function startFps() {
    if (fpsId) return;
    function tick() {
      state._frames++;
      var now = performance.now();
      if (now - state._fpsTime >= 1000) { state.fps = state._frames; state._frames = 0; state._fpsTime = now; if (state.open && state.tab === 'performance') updatePerf(); }
      if (state.open) fpsId = requestAnimationFrame(tick); else fpsId = null;
    }
    fpsId = requestAnimationFrame(tick);
  }
  function stopFps() { if (fpsId) { cancelAnimationFrame(fpsId); fpsId = null; } state.fps = 0; }

  /* ===================== TOOLS TAB ===================== */
  function buildToolsTab() {
    toolsGrid.innerHTML = \`
      <div class="dt-tool-card">
        <h4>🎨 Color Picker</h4>
        <p>Pick any color or use the palette</p>
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
        <p>Current viewport and device info</p>
        <div style="font-family:'SF Mono',Consolas,monospace;font-size:12px;color:#c9d1d9;line-height:1.8" id="dt-vp-info"></div>
        <div class="dt-vp-vis"><div class="dt-vp-box" id="dt-vp-box"></div></div>
      </div>
      <div class="dt-tool-card">
        <h4>📦 Storage</h4>
        <p>View and manage localStorage entries</p>
        <div id="dt-ls-content"></div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <button class="dt-btn" id="dt-ls-add">+ Add Key</button>
          <button class="dt-btn danger" id="dt-clr-all">Clear All</button>
        </div>
      </div>
      <div class="dt-tool-card">
        <h4>📄 Page Info</h4>
        <p>Meta tags and document info</p>
        <div id="dt-page-info"></div>
      </div>
      <div class="dt-tool-card">
        <h4>📸 Screenshot</h4>
        <p>Capture the page content (without dev tools)</p>
        <button class="dt-btn primary" id="dt-screenshot" style="width:100%">Capture Screenshot</button>
        <p style="font-size:11px;color:#3d444d;margin-top:8px">Uses html2canvas if available</p>
      </div>
    \`;
    initColorPicker();
    initStorageViewer();
  }

  function initColorPicker() {
    var cInput = q('#dt-cinput', toolsGrid);
    var cHex = q('#dt-chex', toolsGrid);
    var cPrev = q('#dt-cprev', toolsGrid);
    var cSwatches = q('#dt-cswatches', toolsGrid);
    var colors = ['#7c5cfc','#58a6ff','#3fb950','#f0883e','#f85149','#d2a8ff','#ffa657','#79c0ff','#56d4dd','#ff7b72','#e6edf3','#0d1117','#161b22','#30363d','#8b949e','#f0f6fc'];
    colors.forEach(function(c) {
      var s = document.createElement('div');
      s.className = 'dt-csw'; s.style.background = c;
      s.addEventListener('click', function() { setColor(c); });
      cSwatches.appendChild(s);
    });
    function setColor(c) { cInput.value = c; cHex.value = c; cPrev.style.background = c; }
    cInput.addEventListener('input', function() { setColor(cInput.value); });
    cHex.addEventListener('input', function() { var v = cHex.value; if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(v); });
    q('#dt-ccopy', toolsGrid).addEventListener('click', function() {
      navigator.clipboard.writeText(cHex.value).then(function() { var b = q('#dt-ccopy', toolsGrid); b.textContent = '✓ Copied!'; setTimeout(function() { b.textContent = 'Copy'; }, 1200); });
    });
    if ('EyeDropper' in window) { var ed = q('#dt-ceyedrop', toolsGrid); ed.style.display = ''; ed.addEventListener('click', function() { new EyeDropper().open().then(function(r) { setColor(r.sRGBHex); }); }); }
  }

  function updateViewport() {
    var vpInfo = q('#dt-vp-info'); if (!vpInfo) return;
    var w = window.innerWidth, h = window.innerHeight;
    vpInfo.innerHTML = '<div><span style="color:#6e7681">Inner:</span> ' + w + ' × ' + h + 'px</div><div><span style="color:#6e7681">Outer:</span> ' + window.outerWidth + ' × ' + window.outerHeight + 'px</div><div><span style="color:#6e7681">DPR:</span> ' + (window.devicePixelRatio || 1) + 'x</div><div><span style="color:#6e7681">Screen:</span> ' + screen.width + ' × ' + screen.height + 'px</div>';
    var vpBox = q('#dt-vp-box'); if (!vpBox) return;
    var scale = Math.min(140 / w, 80 / h, 1);
    vpBox.style.width = Math.round(w * scale) + 'px';
    vpBox.style.height = Math.round(h * scale) + 'px';
    vpBox.textContent = w + '×' + h;
  }
  window.addEventListener('resize', function() { if (state.open && state.tab === 'tools') updateViewport(); });

  function initStorageViewer() { updateStorage(); }
  function updateStorage() {
    var container = q('#dt-ls-content'); if (!container) return;
    try {
      var keys = Object.keys(localStorage);
      if (keys.length === 0) { container.innerHTML = '<div style="color:#3d444d;font-size:12px;padding:8px 0">No entries</div>'; return; }
      var rows = '';
      keys.forEach(function(k) {
        var v = localStorage.getItem(k);
        var shortV = v.length > 40 ? v.slice(0, 37) + '...' : v;
        rows += '<tr><td title="' + esc(k) + '">' + esc(k) + '</td><td title="' + esc(v) + '">' + esc(shortV) + '</td><td class="dt-ls-actions"><button class="del" data-k="' + esc(k) + '" title="Delete">✕</button></td></tr>';
      });
      container.innerHTML = '<table class="dt-ls-table"><thead><tr><th>Key</th><th>Value</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
      qa('.del', container).forEach(function(btn) {
        btn.addEventListener('click', function() { localStorage.removeItem(btn.dataset.k); updateStorage(); });
      });
    } catch(e) { container.innerHTML = '<div style="color:#3d444d;font-size:12px">Storage unavailable</div>'; }
  }

  var lsAddBtn = null;
  function initLsAdd() {
    if (lsAddBtn) return;
    lsAddBtn = true;
    document.addEventListener('click', function(e) {
      if (e.target && e.target.id === 'dt-ls-add') {
        var key = prompt('Key name:');
        if (!key) return;
        var val = prompt('Value:', '');
        if (val === null) return;
        try { localStorage.setItem(key, val); updateStorage(); } catch(e) { alert('Error: ' + e.message); }
      }
      if (e.target && e.target.id === 'dt-clr-all') {
        if (confirm('Clear all localStorage?')) { localStorage.clear(); updateStorage(); }
      }
    });
  }

  function updatePageInfo() {
    var container = q('#dt-page-info'); if (!container) return;
    var title = document.title || '(none)';
    var rows = '<div class="dt-page-info-row"><span class="pk">Title</span><span class="pv">' + esc(title) + '</span></div>';
    rows += '<div class="dt-page-info-row"><span class="pk">URL</span><span class="pv">' + esc(window.location.href) + '</span></div>';
    rows += '<div class="dt-page-info-row"><span class="pk">Charset</span><span class="pv">' + esc(document.characterSet) + '</span></div>';
    rows += '<div class="dt-page-info-row"><span class="pk">Language</span><span class="pv">' + esc(document.documentElement.lang || '(none)') + '</span></div>';
    var metas = qa('meta');
    metas.forEach(function(m) {
      var name = m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv') || m.getAttribute('charset') || '';
      var content = m.getAttribute('content') || '';
      if (name && content) rows += '<div class="dt-page-info-row"><span class="pk">' + esc(name) + '</span><span class="pv">' + esc(content) + '</span></div>';
    });
    if (metas.length === 0) rows += '<div style="color:#3d444d;font-size:12px;padding:4px 0">No meta tags</div>';
    container.innerHTML = rows;
  }

  function buildToolsTab() {
    toolsGrid.innerHTML = \`
      <div class="dt-tool-card">
        <h4>🎨 Color Picker</h4>
        <p>Pick any color or use the palette</p>
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
        <p>Current viewport and device info</p>
        <div style="font-family:'SF Mono',Consolas,monospace;font-size:12px;color:#c9d1d9;line-height:1.8" id="dt-vp-info"></div>
        <div class="dt-vp-vis"><div class="dt-vp-box" id="dt-vp-box"></div></div>
      </div>
      <div class="dt-tool-card">
        <h4>📦 Storage</h4>
        <p>View and manage localStorage entries</p>
        <div id="dt-ls-content"></div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <button class="dt-btn" id="dt-ls-add">+ Add Key</button>
          <button class="dt-btn danger" id="dt-clr-all">Clear All</button>
        </div>
      </div>
      <div class="dt-tool-card">
        <h4>📄 Page Info</h4>
        <p>Meta tags and document info</p>
        <div id="dt-page-info"></div>
      </div>
      <div class="dt-tool-card">
        <h4>📸 Screenshot</h4>
        <p>Capture the page content (without dev tools)</p>
        <button class="dt-btn primary" id="dt-screenshot" style="width:100%">Capture Screenshot</button>
        <p style="font-size:11px;color:#3d444d;margin-top:8px">Loads html2canvas automatically on first use</p>
      </div>
    \`;
    initColorPicker();
    initStorageViewer();

    // Screenshot handler — now INSIDE buildToolsTab so the element exists
    q('#dt-screenshot', toolsGrid).addEventListener('click', function() {
      var btn = this;
      function doCapture() {
        btn.textContent = 'Capturing...';
        btn.disabled = true;
        panel.style.display = 'none'; fab.style.display = 'none'; highlight.style.display = 'none'; respOverlay.style.display = 'none';
        setTimeout(function() {
          html2canvas(document.body).then(function(canvas) {
            panel.style.display = ''; fab.style.display = '';
            btn.disabled = false;
            var link = document.createElement('a');
            link.download = 'screenshot-' + Date.now() + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            btn.textContent = '✓ Saved!';
            setTimeout(function() { btn.textContent = 'Capture Screenshot'; }, 1500);
          }).catch(function() {
            panel.style.display = ''; fab.style.display = '';
            btn.disabled = false;
            btn.textContent = 'Capture Screenshot';
            alert('Screenshot failed');
          });
        }, 100);
      }
      if (typeof html2canvas !== 'undefined') {
        doCapture();
      } else {
        btn.textContent = 'Loading...';
        btn.disabled = true;
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = function() { btn.disabled = false; doCapture(); };
        s.onerror = function() { btn.disabled = false; btn.textContent = 'Capture Screenshot'; alert('Failed to load html2canvas — check internet.'); };
        document.head.appendChild(s);
      }
    });
  }

  buildToolsTab();
  initLsAdd();

  /* ===================== RESPONSIVE VIEW ===================== */
  function setRespSize(w, h) {
    var body = q('.dt-resp-body', respOverlay);
    var maxW = body.clientWidth - 48;
    var maxH = body.clientHeight - 60;
    if (w === 0) { w = maxW; h = maxH; }
    var scale = Math.min(1, maxW / w, maxH / h);
    var dispW = Math.round(w * scale);
    var dispH = Math.round(h * scale);
    respFrameWrap.style.width = dispW + 'px';
    respFrameWrap.style.height = dispH + 'px';
    respFrame.style.width = w + 'px';
    respFrame.style.height = h + 'px';
    respFrameWrap.style.transform = 'scale(1)';
    respDim.textContent = w + ' × ' + h + (scale < 1 ? ' (scaled ' + Math.round(scale * 100) + '%)' : '');
    rwInput.value = w; rhInput.value = h;
  }

  function loadRespFrame() {
    var sep = window.location.href.includes('?') ? '&' : '?';
    respFrame.src = window.location.href + sep + '__notools=1';
  }

  function openResp() {
    state.respOpen = true;
    respOverlay.classList.add('open');
    respBtn.classList.add('active');
    setRespSize(375, 667);
    loadRespFrame();
  }
  function closeResp() {
    state.respOpen = false;
    respOverlay.classList.remove('open');
    respBtn.classList.remove('active');
    respFrame.src = 'about:blank';
  }

  respBtn.addEventListener('click', function() { state.respOpen ? closeResp() : openResp(); });
  q('#dt-resp-close').addEventListener('click', closeResp);

  qa('.dt-resp-dev', respOverlay).forEach(function(btn) {
    btn.addEventListener('click', function() {
      qa('.dt-resp-dev', respOverlay).forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var d = devices[parseInt(btn.dataset.i)];
      setRespSize(d.w, d.h);
      loadRespFrame();
    });
  });

  q('#dt-resp-rotate').addEventListener('click', function() {
    var w = parseInt(rwInput.value) || 375;
    var h = parseInt(rhInput.value) || 667;
    rwInput.value = h; rhInput.value = w;
    setRespSize(h, w);
    loadRespFrame();
  });

  rwInput.addEventListener('change', function() { setRespSize(parseInt(rwInput.value) || 375, parseInt(rhInput.value) || 667); });
  rhInput.addEventListener('change', function() { setRespSize(parseInt(rwInput.value) || 375, parseInt(rhInput.value) || 667); });

  /* ===================== KEYBOARD ===================== */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (state.respOpen) { closeResp(); e.preventDefault(); return; }
      if (state.open) { closePanel(); e.preventDefault(); }
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'T') { e.preventDefault(); togglePanel(); }
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      if (!state.open) openPanel();
      switchTab('elements');
      if (!state.inspecting) startInspect();
    }
  });

  console.log('%c🔧 Dev Tools loaded', 'color:#7c5cfc;font-weight:bold;', '- ⊕ button or Ctrl+Shift+T');
})();
`;

// ============================================================
// HTTP SERVER
// ============================================================
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url);
  const urlPath = url.split('?')[0];

  if (urlPath === '/' || urlPath === '') {
    serveDashboard(res);
    return;
  }

  if (urlPath === '/tools.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(TOOLS_SCRIPT);
    return;
  }

  if (url.startsWith('/api/source?')) {
    const params = new URLSearchParams(url.split('?')[1]);
    const filePath = params.get('path');
    if (filePath) {
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

  const match = urlPath.match(/^\/projects\/(.+?)\/(.+)$/);
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
        if (ext === '.html' && !url.includes('__notools')) {
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
  res.end(`<h1>404 - Not Found</h1><p>${urlPath}</p>`);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🔧 Dev Tools: ⊕ button or Ctrl+Shift+T`);
  console.log(`🔍 Quick inspect: Ctrl+Shift+I`);
});