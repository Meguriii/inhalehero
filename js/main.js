// ============================================================
// 推箱子 — 主入口 / 初始化 / 事件绑定 / 动画循环
// ============================================================

// ============================================================
//  TOAST
// ============================================================
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ============================================================
//  SCREEN SWITCHING
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ============================================================
//  LEVEL SELECTOR
// ============================================================
function renderLevelGrid() {
  const g = document.getElementById('lvlGrid'); g.innerHTML = '';
  levels.forEach((lvl, i) => {
    const card = document.createElement('div'); card.className = 'lvl-card';
    const dc = `diff-${lvl.difficulty || 1}`;
    card.innerHTML = `<div class="name">${i + 1}. ${lvl.name || '未命名'}</div><div class="desc">${lvl.description || ''}</div><div class="meta"><span class="${dc}">${'★'.repeat(lvl.difficulty || 1)}</span><span>${lvl.author || 'unknown'}</span></div><canvas class="lvl-mini" width="200" height="40"></canvas>`;
    card.addEventListener('click', () => { loadLevel(i); showScreen('gameScreen'); });
    const mc = card.querySelector('.lvl-mini'), mt = mc.getContext('2d');
    const rows = lvl.map.length, cols = lvl.map[0].length, mts = Math.max(1, Math.min(Math.floor(40 / rows), Math.floor(200 / cols)));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ch = (lvl.map[r] || '')[c] || 'W', x = c * mts, y = r * mts;
      if (ch === 'W') mt.fillStyle = C.wall2;
      else if (ch === '~') mt.fillStyle = '#1e3a5f';
      else if (ch === 'X') mt.fillStyle = C.box1;
      else if (ch === 'T') mt.fillStyle = C.target1;
      else if (ch === '0') mt.fillStyle = C.wRed;
      else if (ch === '1') mt.fillStyle = C.tGrn;
      else if (ch === '2') mt.fillStyle = C.mMag;
      else if (ch === '3') mt.fillStyle = C.priestGold;
      else if (ch === 'P') mt.fillStyle = C.doorP;
      else if (ch === 'Y') mt.fillStyle = C.doorY;
      else if (ch === 'p') { mt.fillStyle = C.floor1; mt.fillRect(x, y, mts, mts); mt.fillStyle = C.switchP; mt.fillRect(x + 1, y + 1, mts - 2, mts - 2); }
      else if (ch === 'y') { mt.fillStyle = C.floor1; mt.fillRect(x, y, mts, mts); mt.fillStyle = C.switchY; mt.fillRect(x + 1, y + 1, mts - 2, mts - 2); }
      else if (ch === 'M') { mt.fillStyle = C.floor1; mt.fillRect(x, y, mts, mts); mt.fillStyle = C.doorM; mt.fillRect(x + 1, y + 1, mts - 2, mts - 2); }
      else if (ch === 'F' || ch === 'R' || ch === 'D' || ch === 'L') mt.fillStyle = '#E74C3C';
      else if (ch === '.') mt.fillStyle = C.floor1;
      else mt.fillStyle = C.wallDark;
      mt.fillRect(x, y, mts, mts);
    }
    g.appendChild(card);
  });
}

// ============================================================
//  UI EVENTS
// ============================================================
document.querySelectorAll('.char-btn').forEach(btn => { btn.addEventListener('click', () => selectCharacter(parseInt(btn.dataset.char))); });
document.getElementById('switchBtn').addEventListener('click', () => {
  if (world && world.characters.length > 0) {
    world.activeCharIdx = (world.activeCharIdx + 1) % world.characters.length;
    updateCharButtons();
    renderGame();
  }
});
document.getElementById('resetBtn').addEventListener('click', () => loadLevel(currentLevelIdx));
document.getElementById('deathResetBtn').addEventListener('click', () => loadLevel(currentLevelIdx));
document.getElementById('nextLevelBtn').addEventListener('click', () => { loadLevel(currentLevelIdx + 1); });
document.getElementById('toSelectorBtn').addEventListener('click', () => { renderLevelGrid(); showScreen('selectScreen'); });
document.getElementById('toEditorBtn').addEventListener('click', () => { initEditor(); showScreen('editorScreen'); });
document.getElementById('backFromSelect').addEventListener('click', () => showScreen('gameScreen'));
document.getElementById('backFromEditor').addEventListener('click', () => showScreen('gameScreen'));

// ---- Tile key mapping (for keyboard shortcuts) ----
const tileKeyMap = {};
const tm = {
  'empty': 0, 'wall': 1, 'water': 6, 'box': 2, 'target': 3,
  'char0': CHAR_TILE_BASE + 0, 'char1': CHAR_TILE_BASE + 1, 'char2': CHAR_TILE_BASE + 2, 'char3': CHAR_TILE_BASE + 3,
  'doorP': DOOR_PURPLE, 'doorY': DOOR_YELLOW,
  'swP': SWITCH_PURPLE, 'swY': SWITCH_YELLOW,
  'goblin': GOBLIN,
  'monsterGate': DOOR_MAGENTA,
  'dragonUp': 'F', 'dragonRight': 'R', 'dragonDown': 'D', 'dragonLeft': 'L'
};
document.querySelectorAll('.tile-btn').forEach(btn => {
  // Register key-based lookup
  const key = btn.dataset.key;
  if (key) tileKeyMap[key] = btn.dataset.tile;
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    editBrush = tm[btn.dataset.tile] !== undefined ? tm[btn.dataset.tile] : 0;
  });
});

// ---- Editor action key mapping ----
const editorActionKeyMap = {
  't': 'editorTest',
  's': 'editorSave',
  'delete': 'editorClear',
  'e': 'editorExport',
  'i': 'editorImport',
};

document.getElementById('editorClear').addEventListener('click', () => {
  for (let r = 0; r < editRows; r++) for (let c = 0; c < editCols; c++) editGrid[r][c] = '.';
  renderEditor();
});

document.getElementById('sizeInc').addEventListener('click', () => {
  if (editRows >= 30) return;
  const nr = editRows + 2, nc = editCols + 2, ng = [];
  for (let r = 0; r < nr; r++) { ng[r] = []; for (let c = 0; c < nc; c++) ng[r][c] = (r > 0 && r < nr - 1 && c > 0 && c < nc - 1 && r - 1 < editRows && c - 1 < editCols) ? editGrid[r - 1][c - 1] : '.'; }
  editGrid = ng; editRows = nr; editCols = nc;
  editTs = Math.max(24, Math.min(Math.floor(480 / editCols), Math.floor(480 / editRows)));
  renderEditor();
});

document.getElementById('sizeDec').addEventListener('click', () => {
  if (editRows <= 4) return;
  const nr = editRows - 2, nc = editCols - 2, ng = [];
  for (let r = 0; r < nr; r++) { ng[r] = []; for (let c = 0; c < nc; c++) ng[r][c] = editGrid[r + 1][c + 1]; }
  editGrid = ng; editRows = nr; editCols = nc;
  editTs = Math.max(24, Math.min(Math.floor(480 / editCols), Math.floor(480 / editRows)));
  renderEditor();
});

// ---- Editor test ----
document.getElementById('editorTest').addEventListener('click', () => {
  const map = editorGetMap();
  let ch = 0, b = 0, tg = 0;
  for (let r = 0; r < map.length; r++) for (let c = 0; c < map[r].length; c++) {
    const ch2 = map[r][c];
    if (ch2 === 'X') b++; if (ch2 === 'T') tg++;
    if (ch2 === '0' || ch2 === '1' || ch2 === '2' || ch2 === '3') ch++;
  }
  if (ch < 1 || ch > 4) { showToast('⚠ 需要 1–4 个角色'); return; }
  if (tg < ch) { showToast(`⚠ 终点(${tg})不能少于角色(${ch})`); return; }

  // 保存当前世界状态
  const savedLevelIdx = currentLevelIdx;
  const savedWorld = world;

  levels.unshift({ id: '_test', name: '测试', hint: '', map });
  loadLevel(0);
  showScreen('gameScreen');
  showToast('▶ 测试模式，按 R 返回编辑');

  // 覆写重置按钮为返回编辑
  document.getElementById('resetBtn').onclick = () => {
    levels.shift();
    world = savedWorld;
    currentLevelIdx = savedLevelIdx;
    document.getElementById('victoryOverlay').classList.remove('show');
    document.getElementById('deathOverlay').classList.remove('show');
    if (world) {
      setGridSizes(world.rows, world.cols);
      world.tileSize = tileSize;
      updateCharButtons();
      updateSwitchStatusDisplay();
      updateUI();
      renderGame();
    }
    const hintBar = document.getElementById('hintBar');
    const hintText = document.getElementById('hintText');
    if (levels[savedLevelIdx]?.hint) {
      hintText.textContent = levels[savedLevelIdx].hint;
      hintBar.style.display = 'flex';
    } else {
      hintBar.style.display = 'none';
    }
    document.getElementById('resetBtn').onclick = () => loadLevel(currentLevelIdx);
    showScreen('gameScreen');
  };
});

// ---- Editor save ----
document.getElementById('editorSave').addEventListener('click', () => {
  const map = editorGetMap();
  let ch = 0, b = 0, tg = 0;
  for (let r = 0; r < map.length; r++) for (let c = 0; c < map[r].length; c++) {
    const ch2 = map[r][c];
    if (ch2 === 'X') b++; if (ch2 === 'T') tg++;
    if (ch2 === '0' || ch2 === '1' || ch2 === '2' || ch2 === '3') ch++;
  }
  if (ch < 1 || ch > 4) { showToast('⚠ 需要 1–4 个角色'); return; }
  if (tg < ch) { showToast(`⚠ 终点(${tg})不能少于角色(${ch})`); return; }
  const modal = document.getElementById('modalOverlay');
  document.getElementById('modalTitle').textContent = '💾 保存关卡';
  document.getElementById('modalBody').innerHTML = `
    <div style="font-size:11px;color:var(--dim);margin-bottom:8px">关卡名称:</div>
    <input id="lvlNameInput" style="width:100%;padding:8px 12px;background:rgba(0,0,0,0.4);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:'Press Start 2P',monospace;font-size:12px;margin-bottom:10px" value="我的关卡 ${customLevels.length + 1}">
    <div style="font-size:11px;color:var(--dim);margin-bottom:8px">描述:</div>
    <input id="lvlDescInput" style="width:100%;padding:8px 12px;background:rgba(0,0,0,0.4);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:'Press Start 2P',monospace;font-size:12px;margin-bottom:10px" value="">
    <div style="font-size:11px;color:var(--dim);margin-bottom:4px">预览:</div>
    <pre style="font-size:11px;color:var(--dimmer);background:rgba(0,0,0,0.3);padding:8px;border-radius:6px;line-height:1.3">${map.join('\n')}</pre>`;
  document.getElementById('modalActions').innerHTML = `<button class="btn" onclick="document.getElementById('modalOverlay').classList.remove('show')">取消</button><button class="btn btn-gold" id="modalSaveConfirm">保存</button>`;
  modal.classList.add('show');
  document.getElementById('modalSaveConfirm').addEventListener('click', () => {
    const name = document.getElementById('lvlNameInput').value || '未命名', desc = document.getElementById('lvlDescInput').value || '';
    const nl = { id: 'custom_' + Date.now(), name, description: desc, author: '玩家自制', difficulty: 2, hint: '', map };
    customLevels.push(nl); levels.push(nl);
    loadLevel(levels.length - 1); showScreen('gameScreen');
    modal.classList.remove('show');
    // Download as file
    const blob = new Blob([JSON.stringify(customLevels, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'custom-levels.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('✅ 已保存 (请放入 levels/ 目录)');
  }, { once: true });
});

// ---- Editor export ----
document.getElementById('editorExport').addEventListener('click', () => {
  const map = editorGetMap(), json = JSON.stringify({ map, dimensions: { rows: editRows, cols: editCols } }, null, 2);
  const modal = document.getElementById('modalOverlay');
  document.getElementById('modalTitle').textContent = '📤 导出 (JSON)';
  document.getElementById('modalBody').innerHTML = `<textarea class="modal-text" readonly id="exportText">${json}</textarea><div style="font-size:10px;color:var(--dim);margin-top:4px">复制此 JSON 可分享</div>`;
  document.getElementById('modalActions').innerHTML = `<button class="btn" onclick="document.getElementById('modalOverlay').classList.remove('show')">关闭</button><button class="btn" id="copyExportBtn">📋 复制</button>`;
  modal.classList.add('show');
  document.getElementById('copyExportBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(json).then(() => { showToast('✅ 已复制'); modal.classList.remove('show'); }).catch(() => { document.getElementById('exportText').select(); document.execCommand('copy'); showToast('✅ 已复制'); modal.classList.remove('show'); });
  });
});

// ---- Editor import ----
document.getElementById('editorImport').addEventListener('click', () => {
  const modal = document.getElementById('modalOverlay');
  document.getElementById('modalTitle').textContent = '📥 导入 (JSON)';
  document.getElementById('modalBody').innerHTML = `<textarea class="modal-text" id="importText" placeholder='{"map":["WWWW","W..W","W..W","WWWW"]}'></textarea><div style="font-size:10px;color:var(--dim);margin-top:4px">粘贴 JSON 格式</div>`;
  document.getElementById('modalActions').innerHTML = `<button class="btn" onclick="document.getElementById('modalOverlay').classList.remove('show')">取消</button><button class="btn btn-gold" id="importConfirm">导入</button>`;
  modal.classList.add('show');
  document.getElementById('importConfirm').addEventListener('click', () => {
    try { const data = JSON.parse(document.getElementById('importText').value); if (!data.map || !Array.isArray(data.map)) { showToast('⚠ 无效格式'); return; } editorLoadMap(data.map); modal.classList.remove('show'); showToast('✅ 已导入'); } catch (e) { showToast('⚠ JSON 解析失败'); }
  }, { once: true });
});

// ============================================================
//  全局渲染函数（供 world.js 调用）
// ============================================================
function renderGame() {
  if (world) {
    world.render();
    world.renderParticles();
  }
}

// ============================================================
//  Keyboard
// ============================================================
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();

  // ===== EDITOR MODE =====
  if (document.getElementById('editorScreen').classList.contains('active')) {
    // Esc → back to game
    if (k === 'escape') { e.preventDefault(); document.getElementById('backFromEditor').click(); return; }
    // R → Reset editor
    if (k === 'r') { e.preventDefault(); initEditor(); renderEditor(); return; }
    // T → Test, S → Save, Delete → Clear
    if (k === 't') { document.getElementById('editorTest').click(); e.preventDefault(); return; }
    if (k === 's') { document.getElementById('editorSave').click(); e.preventDefault(); return; }
    if (k === 'delete') { document.getElementById('editorClear').click(); e.preventDefault(); return; }
    // O → Export, I → Import
    if (k === 'o') { document.getElementById('editorExport').click(); e.preventDefault(); return; }
    if (k === 'i') { document.getElementById('editorImport').click(); e.preventDefault(); return; }
    // Tile selection via keyboard (digits, letters)
    if (tileKeyMap[k]) {
      const tileName = tileKeyMap[k];
      document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
      const btn = document.querySelector(`.tile-btn[data-tile="${tileName}"]`);
      if (btn) {
        btn.classList.add('active');
        editBrush = tm[tileName] !== undefined ? tm[tileName] : 0;
      }
      e.preventDefault();
      return;
    }
    return;
  }

  // ===== SELECT SCREEN =====
  if (document.getElementById('selectScreen').classList.contains('active')) {
    if (k === 'escape') { document.getElementById('backFromSelect').click(); e.preventDefault(); return; }
    return;
  }

  // ===== GAME SCREEN =====
  if (!document.getElementById('gameScreen').classList.contains('active')) return;

  // Z → Level Select
  if (k === 'z') {
    renderLevelGrid();
    showScreen('selectScreen');
    e.preventDefault();
    return;
  }
  // C → Editor
  if (k === 'c') {
    initEditor();
    showScreen('editorScreen');
    e.preventDefault();
    return;
  }
  // Q → Switch character
  if (k === 'q') {
    if (world && world.characters.length > 0) {
      world.activeCharIdx = (world.activeCharIdx + 1) % world.characters.length;
      updateCharButtons();
      renderGame();
    }
    return;
  }
  // Character selection
  if (k === '1') { selectCharacter(0); return; }
  if (k === '2') { selectCharacter(1); return; }
  if (k === '3') { selectCharacter(2); return; }
  if (k === '4') { selectCharacter(3); return; }
  // R → Reset
  if (k === 'r') { loadLevel(currentLevelIdx); return; }
  // Enter/Space → Next level on victory
  if ((k === 'enter' || k === ' ') && document.getElementById('victoryOverlay').classList.contains('show')) {
    e.preventDefault();
    document.getElementById('nextLevelBtn').click();
    return;
  }
  // Movement
  switch (k) {
    case 'arrowup': case 'w': e.preventDefault(); movePlayer(-1, 0); break;
    case 'arrowdown': case 's': e.preventDefault(); movePlayer(1, 0); break;
    case 'arrowleft': case 'a': e.preventDefault(); movePlayer(0, -1); break;
    case 'arrowright': case 'd': e.preventDefault(); movePlayer(0, 1); break;
  }
});

// ---- D-Pad ----
document.querySelector('.dpad-btn.d-up').addEventListener('click', () => movePlayer(-1, 0));
document.querySelector('.dpad-btn.d-down').addEventListener('click', () => movePlayer(1, 0));
document.querySelector('.dpad-btn.d-left').addEventListener('click', () => movePlayer(0, -1));
document.querySelector('.dpad-btn.d-right').addEventListener('click', () => movePlayer(0, 1));

// ---- Touch ----
let sx = 0, sy = 0, tch = false;
canvas.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; sx = t.clientX; sy = t.clientY; tch = true; }, { passive: false });
canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
canvas.addEventListener('touchend', e => { e.preventDefault(); if (!tch) return; tch = false; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; if (Math.abs(dx) > Math.abs(dy)) movePlayer(0, dx > 0 ? 1 : -1); else movePlayer(dy > 0 ? 1 : -1, 0); }, { passive: false });

// ============================================================
//  INIT
// ============================================================
async function init() {
  try { const r = await fetch('levels/builtin-levels.json'); levels = await r.json(); } catch (e) { console.warn(e); levels = []; }
  try { const r2 = await fetch('levels/custom-levels.json'); const cl = await r2.json(); if (Array.isArray(cl) && cl.length > 0) { customLevels = cl; levels.push(...customLevels); } } catch (e) { }
  loadLevel(0);

  // Animation loop: 每帧更新圣光威胁检测 + 粒子 + 渲染
  (function loop() {
    if (world) {
      world.computeThreatenedTiles();
      world.updateParticles();
      world.updateMonsterGates();
    }
    renderGame();
    requestAnimationFrame(loop);
  })();
}
init();