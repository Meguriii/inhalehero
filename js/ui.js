// ============================================================
// 推箱子 — UI / 屏幕导航
// ============================================================

function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

let selGridCache = [];
function showLevelSelect() {
  const grid = document.getElementById('levelGrid');
  const allLevels = [...levels, ...customLevels];
  grid.innerHTML = '';
  selGridCache = [];
  for (let i = 0; i < allLevels.length; i++) {
    const lvl = allLevels[i];
    const card = document.createElement('div');
    card.className = 'lvl-card';
    const stars = lvl.difficulty === 4 ? '⭐⭐⭐⭐' : lvl.difficulty === 3 ? '⭐⭐⭐' : lvl.difficulty === 2 ? '⭐⭐' : '⭐';
    card.innerHTML = `<div class="name">${lvl.name || '关卡 ' + (i + 1)}</div><div class="desc">${lvl.hint || ''}</div><div class="meta"><span class="diff-${lvl.difficulty || 1}">${stars}</span><span>${lvl.id || ''}</span></div>`;
    card.addEventListener('click', () => {
      if (i < levels.length) { loadLevel(i); switchScreen('gameScreen'); }
      else { loadCustomLevel(i - levels.length); switchScreen('gameScreen'); }
    });
    grid.appendChild(card);
    selGridCache.push(lvl);
  }
  switchScreen('selectScreen');
}

function loadCustomLevel(index) {
  if (index >= customLevels.length) return;
  const raw = customLevels[index];
  if (!raw || !raw.map || raw.map.length === 0) return;
  // Insert into levels array temporarily
  levels.push(raw);
  const idx = levels.length - 1;
  loadLevel(idx);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timeout); t._timeout = setTimeout(() => t.classList.remove('show'), 2000);
}

function showImportModal() {
  document.getElementById('importModal').classList.add('show');
  document.getElementById('importText').value = '';
}

function doImport() {
  const raw = document.getElementById('importText').value.trim();
  if (!raw) { showToast('粘贴关卡数据'); return; }
  try {
    let obj;
    try { obj = JSON.parse(raw); } catch (e) {
      // Try plain map
      const lines = raw.split('\n').map(l => l.trim()).filter(l => l);
      obj = { name: '导入关卡', map: lines, hint: '', difficulty: 1 };
    }
    if (obj && obj.map) {
      customLevels.push(obj);
      document.getElementById('importModal').classList.remove('show');
      showToast('关卡已导入');
      showLevelSelect();
    } else showToast('无效的关卡数据');
  } catch (e) { showToast('解析失败'); }
}

function exportCurrentMap() {
  const map = exportLevel();
  showToast('已复制到剪贴板！');
  navigator.clipboard.writeText(JSON.stringify({ name: document.getElementById('levelName').value || '自定义', map, hint: document.getElementById('levelHint').value || '', difficulty: parseInt(document.getElementById('levelDifficulty').value) || 1 }, null, 2)).catch(() => {});
  document.getElementById('exportTextArea').value = JSON.stringify({ name: document.getElementById('levelName').value || '自定义', map, hint: document.getElementById('levelHint').value || '', difficulty: parseInt(document.getElementById('levelDifficulty').value) || 1 }, null, 2);
  document.getElementById('exportModal').classList.add('show');
}