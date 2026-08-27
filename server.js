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
// 🛠️ CLEAN TOOLS SCRIPT (Only injected into project pages)
// ============================================================
function getToolsScript() {
  return `
  <script>
  (function() {
    // ---------- Minimal CSS ----------
    const style = document.createElement('style');
    style.textContent = \`
      /* Floating button - clean, small, like Next.js dev toolbar */
      .tools-fab {
        position: fixed;
        bottom: 24px;
        left: 24px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #0d1117;
        border: 1px solid #30363d;
        color: #c9d1d9;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        user-select: none;
        font-family: inherit;
        line-height: 1;
      }
      .tools-fab:hover {
        background: #1f242f;
        border-color: #58a6ff;
        transform: scale(1.05);
      }
      .tools-fab.active {
        background: #1f6feb;
        border-color: #58a6ff;
        color: #fff;
      }
      /* Dropdown menu */
      .tools-menu {
        position: fixed;
        bottom: 78px;
        left: 24px;
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 8px 0;
        min-width: 210px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        z-index: 99998;
        display: none;
        flex-direction: column;
        backdrop-filter: blur(16px);
        background: rgba(22, 27, 34, 0.95);
        max-height: 70vh;
        overflow-y: auto;
      }
      .tools-menu.open { display: flex; animation: slideUp 0.2s cubic-bezier(0.4,0,0.2,1); }
      @keyframes slideUp {
        from { opacity:0; transform:translateY(12px) scale(0.96); }
        to { opacity:1; transform:translateY(0) scale(1); }
      }
      .tools-menu-item {
        padding: 8px 18px;
        color: #c9d1d9;
        background: none;
        border: none;
        text-align: left;
        font-size: 0.85rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background 0.1s;
        font-family: inherit;
        width: 100%;
        white-space: nowrap;
      }
      .tools-menu-item:hover {
        background: #1f242f;
        color: #f0f6fc;
      }
      .tools-menu-item .icon {
        font-size: 1.1rem;
        width: 24px;
        text-align: center;
      }
      .tools-menu-divider {
        height: 1px;
        background: #30363d;
        margin: 4px 12px;
      }
      .tools-menu-title {
        padding: 6px 18px 2px;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #484f58;
        font-weight: 600;
      }
      /* Modal styles (unchanged, works well) */
      .tool-modal-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:100000; display:none; align-items:center; justify-content:center; animation:fadeIn 0.2s; }
      .tool-modal-overlay.open { display:flex; }
      @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
      .tool-modal { background:#161b22; border:1px solid #30363d; border-radius:20px; padding:24px; max-width:500px; width:90%; max-height:85vh; overflow-y:auto; box-shadow:0 24px 64px rgba(0,0,0,0.8); animation:modalSlide 0.25s cubic-bezier(0.4,0,0.2,1); position:relative; }
      @keyframes modalSlide { from{opacity:0; transform:scale(0.95) translateY(10px);} to{opacity:1; transform:scale(1) translateY(0);} }
      .tool-modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid #30363d; }
      .tool-modal-header h3 { color:#f0f6fc; font-size:1.1rem; font-weight:600; margin:0; }
      .tool-modal-close { background:none; border:none; color:#8b949e; font-size:1.5rem; cursor:pointer; padding:0 8px; transition:color 0.15s; }
      .tool-modal-close:hover { color:#f0f6fc; }
      .tool-modal-body { color:#c9d1d9; font-size:0.9rem; line-height:1.5; }
      .tool-modal-body input, .tool-modal-body textarea, .tool-modal-body select {
        width:100%; padding:8px 12px; background:#0d1117; border:1px solid #30363d; border-radius:6px; color:#f0f6fc; font-size:0.9rem; font-family:inherit; margin:6px 0 10px; box-sizing:border-box; }
      .tool-modal-body input:focus, .tool-modal-body textarea:focus { outline:none; border-color:#58a6ff; }
      .tool-modal-body textarea { min-height:80px; resize:vertical; }
      .tool-modal-body button {
        padding:6px 16px; background:linear-gradient(135deg,#58a6ff,#1f6feb); color:white; border:none; border-radius:6px; font-size:0.85rem; font-weight:500; cursor:pointer; transition:opacity 0.15s; }
      .tool-modal-body button:hover { opacity:0.85; }
      .tool-output { margin-top:10px; padding:10px 14px; background:#0d1117; border-radius:6px; border:1px solid #30363d; font-size:0.85rem; word-break:break-word; max-height:200px; overflow-y:auto; white-space:pre-wrap; font-family:monospace; color:#8b949e; }
      .tool-output.has-content { color:#f0f6fc; }
    \`;
    document.head.appendChild(style);

    // ---------- HTML ----------
    const fab = document.createElement('button');
    fab.className = 'tools-fab';
    fab.innerHTML = '⚙️'; // or use '···' or '☰'
    fab.title = 'Tools (Ctrl+Shift+T)';
    document.body.appendChild(fab);

    const menu = document.createElement('div');
    menu.className = 'tools-menu';
    menu.innerHTML = \`
      <div class="tools-menu-title">🛠️ Tools</div>
      <button class="tools-menu-item" data-tool="color-picker"><span class="icon">🎨</span> Color Picker</button>
      <button class="tools-menu-item" data-tool="todo"><span class="icon">📋</span> To-Do List</button>
      <button class="tools-menu-item" data-tool="json"><span class="icon">🔍</span> JSON Validator</button>
      <button class="tools-menu-item" data-tool="timer"><span class="icon">⏱️</span> Timer</button>
      <button class="tools-menu-item" data-tool="qrcode"><span class="icon">📱</span> QR Code</button>
      <button class="tools-menu-item" data-tool="password"><span class="icon">🔑</span> Password Generator</button>
      <button class="tools-menu-item" data-tool="case"><span class="icon">🔤</span> Text Case</button>
      <button class="tools-menu-item" data-tool="calculator"><span class="icon">🧮</span> Calculator</button>
      <div class="tools-menu-divider"></div>
      <button class="tools-menu-item" data-tool="dashboard"><span class="icon">🏠</span> Dashboard</button>
    \`;
    document.body.appendChild(menu);

    // ---------- State ----------
    let isOpen = false;

    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen = !isOpen;
      menu.classList.toggle('open', isOpen);
      fab.classList.toggle('active', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (isOpen && !menu.contains(e.target) && e.target !== fab) {
        isOpen = false;
        menu.classList.remove('open');
        fab.classList.remove('active');
      }
    });

    // ---------- Tool functions (same as before, but smaller) ----------
    function openModal(title, content) {
      const overlay = document.createElement('div');
      overlay.className = 'tool-modal-overlay open';
      overlay.innerHTML = \`
        <div class="tool-modal">
          <div class="tool-modal-header">
            <h3>\${title}</h3>
            <button class="tool-modal-close">✕</button>
          </div>
          <div class="tool-modal-body">\${content}</div>
        </div>
      \`;
      document.body.appendChild(overlay);
      overlay.querySelector('.tool-modal-close').addEventListener('click', () => overlay.remove());
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
      return overlay;
    }

    // --- Color Picker ---
    function toolColorPicker() {
      const content = \`
        <label>Pick a color:</label>
        <input type="color" id="cp-color" value="#58a6ff">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0;">
          <button onclick="document.getElementById('cp-color').value='#58a6ff'">#58a6ff</button>
          <button onclick="document.getElementById('cp-color').value='#f0883e'">#f0883e</button>
          <button onclick="document.getElementById('cp-color').value='#3fb950'">#3fb950</button>
          <button onclick="document.getElementById('cp-color').value='#f85149'">#f85149</button>
        </div>
        <div class="tool-output" id="cp-output" style="font-family:monospace;">#58a6ff</div>
        <button onclick="
          const c=document.getElementById('cp-color').value;
          document.getElementById('cp-output').textContent=c+' (copied!)';
          navigator.clipboard?.writeText(c);
        ">📋 Copy</button>
        <button onclick="
          const c=document.getElementById('cp-color').value;
          document.body.style.backgroundColor=c;
        ">🎨 Apply</button>
      \`;
      const modal = openModal('🎨 Color Picker', content);
      const input = modal.querySelector('#cp-color');
      input.addEventListener('input', () => {
        modal.querySelector('#cp-output').textContent = input.value;
      });
    }

    // --- To-Do List ---
    function toolTodo() {
      const todos = JSON.parse(localStorage.getItem('tools_todos') || '[]');
      function renderTodo(container) {
        const list = todos.map((t, i) => \`
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #21262d;">
            <input type="checkbox" \${t.done ? 'checked' : ''} onchange="
              const todos=JSON.parse(localStorage.getItem('tools_todos')||'[]');
              todos[\${i}].done=this.checked;
              localStorage.setItem('tools_todos',JSON.stringify(todos));
            ">
            <span style="flex:1;text-decoration:\${t.done?'line-through':'none'};color:\${t.done?'#484f58':'#f0f6fc'}">\${t.text}</span>
            <button onclick="
              const todos=JSON.parse(localStorage.getItem('tools_todos')||'[]');
              todos.splice(\${i},1);
              localStorage.setItem('tools_todos',JSON.stringify(todos));
              this.closest('.tool-modal').querySelector('.todo-list').innerHTML = renderTodoHTML();
            " style="background:none;border:none;color:#f85149;cursor:pointer;font-size:1rem;">✕</button>
          </div>
        \`).join('');
        container.innerHTML = list || '<div style="color:#484f58;text-align:center;padding:12px;">No tasks</div>';
      }
      window.renderTodoHTML = function() {
        const todos = JSON.parse(localStorage.getItem('tools_todos') || '[]');
        return todos.map((t, i) => \`
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #21262d;">
            <input type="checkbox" \${t.done ? 'checked' : ''} onchange="
              const todos=JSON.parse(localStorage.getItem('tools_todos')||'[]');
              todos[\${i}].done=this.checked;
              localStorage.setItem('tools_todos',JSON.stringify(todos));
            ">
            <span style="flex:1;text-decoration:\${t.done?'line-through':'none'};color:\${t.done?'#484f58':'#f0f6fc'}">\${t.text}</span>
            <button onclick="
              const todos=JSON.parse(localStorage.getItem('tools_todos')||'[]');
              todos.splice(\${i},1);
              localStorage.setItem('tools_todos',JSON.stringify(todos));
              document.querySelector('.todo-list').innerHTML = renderTodoHTML();
            " style="background:none;border:none;color:#f85149;cursor:pointer;font-size:1rem;">✕</button>
          </div>
        \`).join('') || '<div style="color:#484f58;text-align:center;padding:12px;">No tasks</div>';
      };
      const content = \`
        <div class="todo-list"></div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <input type="text" id="todo-input" placeholder="Add task..." style="flex:1;">
          <button onclick="
            const input=document.getElementById('todo-input');
            const text=input.value.trim();
            if(!text) return;
            const todos=JSON.parse(localStorage.getItem('tools_todos')||'[]');
            todos.push({text, done:false});
            localStorage.setItem('tools_todos',JSON.stringify(todos));
            input.value='';
            document.querySelector('.todo-list').innerHTML = renderTodoHTML();
          ">Add</button>
        </div>
      \`;
      const modal = openModal('📋 To-Do List', content);
      renderTodo(modal.querySelector('.todo-list'));
    }

    // --- JSON Validator ---
    function toolJSON() {
      const content = \`
        <textarea id="json-input" placeholder='{"hello":"world"}'></textarea>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button onclick="
            const input=document.getElementById('json-input');
            const out=document.getElementById('json-output');
            try { const parsed=JSON.parse(input.value); out.textContent=JSON.stringify(parsed,null,2); out.style.color='#3fb950'; }
            catch(e) { out.textContent='❌ '+e.message; out.style.color='#f85149'; }
          ">✅ Validate</button>
          <button onclick="
            const input=document.getElementById('json-input');
            try { const parsed=JSON.parse(input.value); input.value=JSON.stringify(parsed,null,2); }
            catch(e) { alert('Invalid JSON'); }
          ">📐 Format</button>
        </div>
        <div class="tool-output" id="json-output"></div>
      \`;
      openModal('🔍 JSON Validator', content);
    }

    // --- Timer ---
    function toolTimer() {
      let time = 0, running = false, interval = null;
      function updateDisplay(display) {
        const m = String(Math.floor(time/60)).padStart(2,'0');
        const s = String(time%60).padStart(2,'0');
        display.textContent = m+':'+s;
      }
      const content = \`
        <div style="text-align:center;">
          <div id="timer-display" style="font-size:2.5rem;font-weight:700;font-family:monospace;color:#f0f6fc;letter-spacing:2px;padding:8px 0;">00:00</div>
          <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
            <button id="timer-start">▶ Start</button>
            <button id="timer-pause">⏸ Pause</button>
            <button id="timer-reset">⏹ Reset</button>
          </div>
          <div style="margin-top:8px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
            <button onclick="time=60;updateTimerDisplay();">1m</button>
            <button onclick="time=300;updateTimerDisplay();">5m</button>
            <button onclick="time=600;updateTimerDisplay();">10m</button>
          </div>
        </div>
      \`;
      const modal = openModal('⏱️ Timer', content);
      const display = modal.querySelector('#timer-display');
      window.updateTimerDisplay = function() { updateDisplay(display); };
      updateDisplay(display);
      modal.querySelector('#timer-start').addEventListener('click', ()=>{
        if (running) return;
        running=true;
        interval=setInterval(()=>{ time++; updateDisplay(display); },1000);
      });
      modal.querySelector('#timer-pause').addEventListener('click', ()=>{
        running=false; clearInterval(interval);
      });
      modal.querySelector('#timer-reset').addEventListener('click', ()=>{
        running=false; clearInterval(interval); time=0; updateDisplay(display);
      });
    }

    // --- QR Code ---
    function toolQR() {
      const content = \`
        <input type="text" id="qr-input" placeholder="Enter text/URL" value="https://stackblitz.com">
        <div style="display:flex;gap:6px;margin:6px 0;">
          <button onclick="
            const input=document.getElementById('qr-input');
            const out=document.getElementById('qr-output');
            const text=input.value.trim();
            if(!text){ out.textContent='Please enter text'; return; }
            out.innerHTML='<img src=\"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data='+encodeURIComponent(text)+'\" style=\"max-width:100%;border-radius:6px;border:1px solid #30363d;\">';
          ">Generate</button>
          <button onclick="
            const out=document.getElementById('qr-output');
            const img=out.querySelector('img');
            if(img){ const a=document.createElement('a'); a.href=img.src; a.download='qrcode.png'; a.click(); }
          ">💾 Download</button>
        </div>
        <div id="qr-output" style="text-align:center;padding:4px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=stackblitz.com" style="max-width:100%;border-radius:6px;border:1px solid #30363d;">
        </div>
      \`;
      openModal('📱 QR Code', content);
    }

    // --- Password Generator ---
    function toolPassword() {
      const content = \`
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <label>Length:</label>
          <input type="number" id="pw-length" value="16" min="4" max="64" style="width:60px;">
          <label><input type="checkbox" id="pw-special" checked> Special</label>
        </div>
        <div style="display:flex;gap:6px;margin:6px 0;">
          <button onclick="
            const len=parseInt(document.getElementById('pw-length').value)||16;
            const useSpecial=document.getElementById('pw-special').checked;
            let pool='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            if(useSpecial) pool+='!@#$%^&*()_+-=';
            let pw='';
            for(let i=0;i<len;i++) pw+=pool[Math.floor(Math.random()*pool.length)];
            document.getElementById('pw-output').textContent=pw;
          ">🔑 Generate</button>
          <button onclick="
            const out=document.getElementById('pw-output');
            navigator.clipboard?.writeText(out.textContent);
            const orig=out.textContent;
            out.textContent='📋 Copied!';
            setTimeout(()=>{ out.textContent=orig; },1000);
          ">📋 Copy</button>
        </div>
        <div class="tool-output" id="pw-output" style="font-family:monospace;font-size:1rem;"></div>
      \`;
      openModal('🔑 Password Generator', content);
    }

    // --- Text Case ---
    function toolCase() {
      const content = \`
        <textarea id="case-input" placeholder="Type text...">Hello World! This is a test.</textarea>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin:6px 0;">
          <button onclick="transformCase('lower')">lower</button>
          <button onclick="transformCase('upper')">UPPER</button>
          <button onclick="transformCase('capitalize')">Capitalize</button>
          <button onclick="transformCase('title')">Title</button>
          <button onclick="transformCase('camel')">camelCase</button>
          <button onclick="transformCase('snake')">snake_case</button>
          <button onclick="transformCase('kebab')">kebab-case</button>
        </div>
        <div class="tool-output" id="case-output"></div>
        <script>
          function transformCase(type) {
            const input=document.getElementById('case-input');
            const out=document.getElementById('case-output');
            const text=input.value||'';
            let result='';
            switch(type){
              case 'lower': result=text.toLowerCase(); break;
              case 'upper': result=text.toUpperCase(); break;
              case 'capitalize': result=text.toLowerCase().replace(/^\\\\w/,c=>c.toUpperCase()); break;
              case 'title': result=text.toLowerCase().replace(/\\\\b\\\\w/g,c=>c.toUpperCase()); break;
              case 'camel': result=text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g,(_,c)=>c.toUpperCase()); break;
              case 'snake': result=text.toLowerCase().replace(/\\s+/g,'_').replace(/[^a-z0-9_]/g,''); break;
              case 'kebab': result=text.toLowerCase().replace(/\\s+/g,'-').replace(/[^a-z0-9-]/g,''); break;
            }
            out.textContent=result;
          }
        <\/script>
      \`;
      const modal = openModal('🔤 Text Case', content);
      const script=modal.querySelector('script');
      if(script){ const ns=document.createElement('script'); ns.textContent=script.textContent; script.parentNode.replaceChild(ns,script); }
    }

    // --- Calculator ---
    function toolCalculator() {
      const content = \`
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-width:280px;margin:0 auto;">
          <div style="grid-column:span 4;background:#0d1117;border-radius:6px;padding:10px 14px;text-align:right;font-size:1.6rem;font-family:monospace;color:#f0f6fc;border:1px solid #30363d;min-height:50px;word-break:break-all;" id="calc-display">0</div>
          <button onclick="calcPress('7')">7</button><button onclick="calcPress('8')">8</button><button onclick="calcPress('9')">9</button><button onclick="calcPress('/')" style="color:#f0883e;">÷</button>
          <button onclick="calcPress('4')">4</button><button onclick="calcPress('5')">5</button><button onclick="calcPress('6')">6</button><button onclick="calcPress('*')" style="color:#f0883e;">×</button>
          <button onclick="calcPress('1')">1</button><button onclick="calcPress('2')">2</button><button onclick="calcPress('3')">3</button><button onclick="calcPress('-')" style="color:#f0883e;">−</button>
          <button onclick="calcPress('0')">0</button><button onclick="calcPress('.')">.</button><button onclick="calcPress('C')" style="color:#f85149;">C</button><button onclick="calcPress('+')" style="color:#f0883e;">+</button>
          <button onclick="calcPress('=')" style="grid-column:span 4;background:linear-gradient(135deg,#58a6ff,#1f6feb);color:white;padding:8px;font-size:1.1rem;font-weight:600;border:none;border-radius:6px;cursor:pointer;">=</button>
        </div>
        <script>
          let calcExpr='';
          function calcPress(val) {
            const display=document.getElementById('calc-display');
            if(val==='C'){ calcExpr=''; display.textContent='0'; return; }
            if(val==='='){
              try { const result=Function('"use strict"; return ('+calcExpr+')')(); display.textContent=result; calcExpr=String(result); }
              catch(e){ display.textContent='Error'; calcExpr=''; }
              return;
            }
            calcExpr+=val;
            display.textContent=calcExpr;
          }
        <\/script>
      \`;
      const modal = openModal('🧮 Calculator', content);
      const script=modal.querySelector('script');
      if(script){ const ns=document.createElement('script'); ns.textContent=script.textContent; script.parentNode.replaceChild(ns,script); }
    }

    // ---------- Menu handlers ----------
    const toolMap = {
      'color-picker': toolColorPicker,
      'todo': toolTodo,
      'json': toolJSON,
      'timer': toolTimer,
      'qrcode': toolQR,
      'password': toolPassword,
      'case': toolCase,
      'calculator': toolCalculator,
      'dashboard': () => { window.location.href = '/'; }
    };

    menu.querySelectorAll('.tools-menu-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (toolMap[tool]) {
          toolMap[tool]();
          isOpen = false;
          menu.classList.remove('open');
          fab.classList.remove('active');
        }
      });
    });

    // ---------- Keyboard shortcut ----------
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        fab.click();
      }
    });

    // ---------- Startup hint ----------
    console.log('🛠️ Tools available: click the ⚙️ button or press Ctrl+Shift+T');
  })();
  <\/script>`;
}

// ============================================================
// HTTP SERVER
// ============================================================
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url);
  
  if (url === '/' || url === '') {
    serveDashboard(res);
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
          const toolsScript = getToolsScript();
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
  console.log(`🛠️  Tools button appears on project pages (bottom-left)`);
  console.log(`⌨️  Press Ctrl+Shift+T to toggle tools menu`);
});