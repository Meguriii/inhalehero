// ============================================================
// 推箱子 — 游戏引擎核心（基于 World + Entity 系统）
// ============================================================

let levels = [];
let currentLevelIdx = 0;
let world = null;       // World 实例（游戏逻辑主体）
let customLevels = [];
let tileSize = 48;

function setGridSizes(rows, cols) {
  const maxW = Math.min(window.innerWidth - 80, 720), maxH = Math.min(window.innerHeight - 260, 520);
  tileSize = Math.max(24, Math.floor(Math.min(maxW / cols, maxH / rows)));
  canvas.width = cols * tileSize; canvas.height = rows * tileSize;
}

// ============================================================
//  关卡解析：字符数组 → World 实例
// ============================================================
function parseMapToWorld(raw, overlays) {
  const rows = raw.length;
  const cols = rows > 0 ? raw[0].length : 0;
  const w = new World(rows, cols);

  // 初始化网格地板
  for (let r = 0; r < rows; r++) {
    w.grid[r] = [];
    for (let c = 0; c < cols; c++) {
      w.grid[r][c] = null; // null = Floor
    }
  }

  // 解析每个字符
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = (raw[r] || '')[c] || 'W';
      let entity = null;

      switch (ch) {
        case 'W': entity = new Wall(r, c); break;
        case '.': entity = null; break; // Floor = null
        case 'X': entity = new Box(r, c); break;
        case 'T':
          // Target 不放入 grid，仅追踪（装饰性地板层）
          w.targets.push(new Target(r, c));
          entity = null;
          break;
        case '~': entity = new Water(r, c); break;
        case 'P':
          // Door 不放入 grid，仅通过 doors[] 追踪碰撞
          w.doors.push(new Door(r, c, 0));
          entity = null;
          break;
        case 'Y':
          // Door 不放入 grid，仅通过 doors[] 追踪碰撞
          w.doors.push(new Door(r, c, 1));
          entity = null;
          break;
        case 'p':
          // Switch 不放入 grid，仅追踪
          w.switches.push(new Switch(r, c, 0));
          entity = null;
          break;
        case 'y':
          // Switch 不放入 grid，仅追踪
          w.switches.push(new Switch(r, c, 1));
          entity = null;
          break;
        case '0':
          entity = new Warrior(r, c);
          w.characters.push(entity);
          break;
        case '1':
          entity = new Thief(r, c);
          w.characters.push(entity);
          break;
        case '2':
          entity = new Mage(r, c);
          w.characters.push(entity);
          break;
        case '3':
          entity = new Priest(r, c);
          w.characters.push(entity);
          break;
        case 'G':
          entity = new Goblin(r, c);
          w.monsters.push(entity);
          break;
        case 'F':
          entity = new FireDragon(r, c, 0); // 朝上
          w.monsters.push(entity);
          break;
        case 'R':
          entity = new FireDragon(r, c, 1); // 朝右
          w.monsters.push(entity);
          break;
        case 'D':
          entity = new FireDragon(r, c, 2); // 朝下
          w.monsters.push(entity);
          break;
        case 'L':
          entity = new FireDragon(r, c, 3); // 朝左
          w.monsters.push(entity);
          break;
        case 'M':
          // MonsterGate 不放入 grid，仅通过 monsterGates[] 追踪碰撞
          w.monsterGates.push(new MonsterGate(r, c));
          entity = null;
          break;
      }

      if (entity) {
        w.grid[r][c] = entity;
      }
    }
  }

  // ---- 处理 overlays（在已有格子上叠加放置实体） ----
  if (overlays && Array.isArray(overlays)) {
    for (const overlay of overlays) {
      const { char, r, c } = overlay;
      let entity = null;

      // 检查是否已有实体占据 grid[r][c]
      const existing = w.grid[r] && w.grid[r][c];
      if (existing && (existing instanceof Wall)) continue; // 墙不可覆盖

      switch (char) {
        case '0':
          entity = new Warrior(r, c);
          w.characters.push(entity);
          break;
        case '1':
          entity = new Thief(r, c);
          w.characters.push(entity);
          break;
        case '2':
          entity = new Mage(r, c);
          w.characters.push(entity);
          break;
        case '3':
          entity = new Priest(r, c);
          w.characters.push(entity);
          break;
        case 'X':
          entity = new Box(r, c);
          break;
        case 'G':
          entity = new Goblin(r, c);
          w.monsters.push(entity);
          break;
        case 'F':
          entity = new FireDragon(r, c, 0);
          w.monsters.push(entity);
          break;
        case 'R':
          entity = new FireDragon(r, c, 1);
          w.monsters.push(entity);
          break;
        case 'D':
          entity = new FireDragon(r, c, 2);
          w.monsters.push(entity);
          break;
        case 'L':
          entity = new FireDragon(r, c, 3);
          w.monsters.push(entity);
          break;
      }

      if (entity) {
        w.grid[r][c] = entity;
      }
    }
  }

  w.updateDoorStates();
  return w;
}

// ============================================================
//  移动逻辑
// ============================================================
function movePlayer(dr, dc) {
  if (!world || world.won || world.gameOver) return false;
  const ch = world.getActiveCharacter();
  if (!ch) return false;

  if (ch.executeMove(world, dr, dc)) {
    world.moveCount++;
    // 确保所有状态更新（有些内部路径绕过 moveEntityTo）
    world.updateDoorStates();
    world.updateMonsters();   // 统一怪物伤害结算（火龙喷火 + 哥布林攻击）
    world.updateMonsterGates();
    world.checkWin();
    updateUI();
    render();
    return true;
  }
  return false;
}

// ============================================================
//  渲染
// ============================================================
function render() {
  if (world) {
    world.render();
    world.renderParticles();
  }
}

// ============================================================
//  关卡加载
// ============================================================
function loadLevel(index) {
  if (index >= levels.length) index = 0;
  currentLevelIdx = index;
  const raw = levels[currentLevelIdx];
  if (!raw || !raw.map || raw.map.length === 0) return;

  world = parseMapToWorld(raw.map.slice(), raw.overlays);
  world.tileSize = tileSize;
  world.activeCharIdx = 0;

  setGridSizes(world.rows, world.cols);
  world.tileSize = tileSize;

  updateSwitchStatusDisplay();
  document.getElementById('victoryOverlay').classList.remove('show');
  document.getElementById('deathOverlay').classList.remove('show');
  document.getElementById('levelTitle').textContent = '✦ ' + (raw.name || '关卡') + ' ✦';
  const hintEl = document.getElementById('hintBar');
  const hintText = document.getElementById('hintText');
  if (raw.hint) {
    hintText.textContent = raw.hint;
    hintEl.style.display = 'flex';
  } else {
    hintEl.style.display = 'none';
  }
  document.getElementById('levelInfo').textContent = `第 ${currentLevelIdx + 1} 关 · 0 步`;
  updateCharButtons();
  render();
}

// ============================================================
//  UI 辅助函数
// ============================================================
function selectCharacter(idx) {
  if (!world) return;
  for (let i = 0; i < world.characters.length; i++) {
    if (world.characters[i].type === idx) {
      world.activeCharIdx = i;
      updateCharButtons();
      render();
      return;
    }
  }
}

function updateCharButtons() {
  document.querySelectorAll('.char-btn').forEach(btn => {
    const idx = parseInt(btn.dataset.char);
    const exists = world && world.characters.some(ch => ch.type === idx);
    const isActive = world && world.characters[world.activeCharIdx]?.type === idx;
    btn.classList.toggle('disabled', !exists);
    btn.classList.toggle('active', exists && isActive);
  });
  // 只有一个角色时禁用切换按钮
  const switchBtn = document.getElementById('switchBtn');
  const hasMultiple = world && world.characters.length > 1;
  switchBtn.classList.toggle('disabled', !hasMultiple);
}

function updateSwitchStatusDisplay() {
  const el = document.getElementById('switchStatus');
  if (!world || world.switches.length === 0) {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }
  const swTotal = { 0: 0, 1: 0 };
  const swPressed = { 0: 0, 1: 0 };
  for (let sw of world.switches) {
    swTotal[sw.color] = (swTotal[sw.color] || 0) + 1;
    const e = world.getEntity(sw.r, sw.c);
    if (e && e !== sw && (e instanceof Character || e instanceof Box)) {
      swPressed[sw.color] = (swPressed[sw.color] || 0) + 1;
    }
  }
  let html = '';
  for (let c of [0, 1]) {
    if (swTotal[c] === 0) continue;
    const pct = swPressed[c] / swTotal[c];
    const cssClass = c === 0 ? 'sw-bar-purple' : 'sw-bar-yellow';
    const fully = (pct >= 1) ? ' fully-active' : '';
    html += `<div class="sw-bar${fully} ${cssClass}"><span class="sw-dot"></span>${swPressed[c]}/${swTotal[c]}</div>`;
  }
  el.style.display = html ? 'flex' : 'none';
  el.innerHTML = html;
}

function updateUI() {
  if (!world) return;
  document.getElementById('levelInfo').textContent = `第 ${currentLevelIdx + 1} 关 · ${world.moveCount} 步`;
}