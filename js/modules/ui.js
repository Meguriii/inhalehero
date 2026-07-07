// ============================================================
// UI 模块 — DOM 更新 / 对话框控制
// ============================================================
import { levels, currentLevelIdx } from './gameState.js';
import { getWorld, getMoveCount, setUICallback, setLevelLoadCallback, selectCharacter, loadLevel } from './gameController.js';

// ---- 屏幕切换 ----
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ---- 初始化 UI 回调 ----
export function initUI() {
  setUICallback(updateUI);
  setLevelLoadCallback(onLevelLoad);
}

/**
 * 更新所有 UI 元素
 */
function updateUI() {
  const w = getWorld();
  if (!w) return;
  const moveCount = getMoveCount();
  document.getElementById('levelInfo').textContent =
    `第 ${currentLevelIdx + 1} 关 · ${moveCount} 步`;
  updateCharButtons();
}

/**
 * 关卡加载时的 UI 更新
 */
function onLevelLoad(raw, index) {
  const w = getWorld();
  if (!w) return;

  // 设置死亡/胜利回调
  w.setDeathCallback((reason) => {
    showDeathOverlay(reason);
  });
  w.setWinCallback(() => {
    showVictoryOverlay();
  });

  document.getElementById('victoryOverlay').classList.remove('show');
  document.getElementById('deathOverlay').classList.remove('show');
  document.getElementById('levelTitle').textContent =
    '✦ ' + (raw.name || '关卡') + ' ✦';

  const hintEl = document.getElementById('hintBar');
  const hintText = document.getElementById('hintText');
  if (raw.hint) {
    hintText.textContent = raw.hint;
    hintEl.style.display = 'flex';
  } else {
    hintEl.style.display = 'none';
  }

  document.getElementById('levelInfo').textContent =
    `第 ${index + 1} 关 · 0 步`;

  updateCharButtons();
}

/**
 * 更新角色按钮状态
 */
function updateCharButtons() {
  const w = getWorld();
  document.querySelectorAll('.char-btn').forEach(btn => {
    const idx = parseInt(btn.dataset.char);
    const exists = w && w.characters.some(ch => ch.type === idx);
    const isActive = w && w.characters[w.activeCharIdx]?.type === idx;
    btn.classList.toggle('disabled', !exists);
    btn.classList.toggle('active', exists && isActive);
  });
  const switchBtn = document.getElementById('switchBtn');
  const hasMultiple = w && w.characters.length > 1;
  switchBtn.classList.toggle('disabled', !hasMultiple);
}

// ---- 胜利与死亡覆盖层 ----

export function showVictoryOverlay() {
  const overlay = document.getElementById('victoryOverlay');
  const steps = getMoveCount();
  document.getElementById('victoryMsg').textContent = `你用了 ${steps} 步完成了第 ${currentLevelIdx + 1} 关！`;
  document.getElementById('victoryNextBtn').style.display =
    currentLevelIdx < levels.length - 1 ? 'inline-block' : 'none';
  overlay.classList.add('show');
}

export function showDeathOverlay(reason) {
  const overlay = document.getElementById('deathOverlay');
  document.getElementById('deathMsg').textContent = reason || '你被击败了...';
  overlay.classList.add('show');
}

export function dismissOverlays() {
  document.getElementById('victoryOverlay').classList.remove('show');
  document.getElementById('deathOverlay').classList.remove('show');
}

// ---- 关卡选择网格渲染 ----

/**
 * 渲染关卡选择网格（迷你地图 + 名称/难度/作者）
 */
export function renderLevelGrid() {
  const g = document.getElementById('lvlGrid');
  g.innerHTML = '';
  levels.forEach((lvl, i) => {
    const card = document.createElement('div');
    card.className = 'lvl-card';
    const dc = `diff-${lvl.difficulty || 1}`;
    card.innerHTML = `
      <div class="name">${i + 1}. ${lvl.name || '未命名'}</div>
      <div class="desc">${lvl.description || ''}</div>
      <div class="meta">
        <span class="${dc}">${'★'.repeat(lvl.difficulty || 1)}</span>
        <span>${lvl.author || 'unknown'}</span>
      </div>
      <canvas class="lvl-mini" width="200" height="40"></canvas>
    `;
    card.addEventListener('click', () => {
      dismissOverlays();
      loadLevel(i);
      showScreen('gameScreen');
    });
    const mc = card.querySelector('.lvl-mini');
    const mt = mc.getContext('2d');
    const rows = lvl.map.length;
    const cols = lvl.map[0].length;
    const mts = Math.max(1, Math.min(Math.floor(40 / rows), Math.floor(200 / cols)));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = (lvl.map[r] || '')[c] || 'W';
        const x = c * mts, y = r * mts;
        if (ch === 'W') mt.fillStyle = '#2c2c3e';
        else if (ch === '~') mt.fillStyle = '#1e3a5f';
        else if (ch === 'X') mt.fillStyle = '#8B4513';
        else if (ch === 'T') mt.fillStyle = '#FFD700';
        else if (ch === '0') mt.fillStyle = '#E74C3C';
        else if (ch === '1') mt.fillStyle = '#2ECC71';
        else if (ch === '2') mt.fillStyle = '#9B59B6';
        else if (ch === '3') mt.fillStyle = '#FFD700';
        else if (ch === 'P') mt.fillStyle = '#9B59B6';
        else if (ch === 'Y') mt.fillStyle = '#F1C40F';
        else if (ch === 'p') {
          mt.fillStyle = '#2a2a3e';
          mt.fillRect(x, y, mts, mts);
          mt.fillStyle = '#9B59B6';
          mt.fillRect(x + 1, y + 1, mts - 2, mts - 2);
          continue;
        } else if (ch === 'y') {
          mt.fillStyle = '#2a2a3e';
          mt.fillRect(x, y, mts, mts);
          mt.fillStyle = '#F1C40F';
          mt.fillRect(x + 1, y + 1, mts - 2, mts - 2);
          continue;
        } else if (ch === 'M') {
          mt.fillStyle = '#2a2a3e';
          mt.fillRect(x, y, mts, mts);
          mt.fillStyle = '#E67E22';
          mt.fillRect(x + 1, y + 1, mts - 2, mts - 2);
          continue;
        } else if (ch === 'F' || ch === 'R' || ch === 'D' || ch === 'L') {
          mt.fillStyle = '#E74C3C';
        } else if (ch === '.') {
          mt.fillStyle = '#2a2a3e';
        } else {
          mt.fillStyle = '#1a1a2e';
        }
        mt.fillRect(x, y, mts, mts);
      }
    }
    g.appendChild(card);
  });
}

// ---- 角色选择按钮点击 ----
export function setupCharacterButtons() {
  document.querySelectorAll('.char-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.char);
      selectCharacter(idx);
    });
  });
}

// ---- 切换角色 ----
export function setupSwitchButton() {
  document.getElementById('switchBtn').addEventListener('click', () => {
    import('./gameController.js').then(m => m.switchCharacter());
  });
}

// ---- 重新开始 ----
export function setupRestartButtons() {
  const restart = () => {
    dismissOverlays();
    loadLevel(currentLevelIdx);
  };
  document.getElementById('restartBtn').addEventListener('click', restart);
  document.getElementById('deathRestartBtn').addEventListener('click', restart);
  document.getElementById('victoryRestartBtn').addEventListener('click', restart);
}

// ---- 下一关 ----
export function setupNextLevelButton() {
  document.getElementById('victoryNextBtn').addEventListener('click', () => {
    dismissOverlays();
    loadLevel(currentLevelIdx + 1);
  });
}

// ---- 关卡选择 / 编辑器 按钮 ----
export function setupLevelSelect() {
  document.getElementById('levelSelectBtn').addEventListener('click', () => {
    renderLevelGrid();
    showScreen('selectScreen');
  });
  document.getElementById('backFromSelect').addEventListener('click', () => {
    showScreen('gameScreen');
  });
}