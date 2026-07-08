// ============================================================
// 关卡解析 — 字符数组 → World 实例
// ============================================================
import {
  World,
} from './world.js';
import {
  Wall, Box, Target, Water,
  Door, MonsterGate, Switch,
  Goblin, FireDragon,
  Warrior, Thief, Mage, Priest,
} from './entity.js';

/**
 * 将字符地图解析为 World 实例
 * @param {string[]} raw 字符数组
 * @param {Array} overlays 叠加层
 * @returns {World}
 */
export function parseMapToWorld(raw, overlays) {
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
          w.targets.push(new Target(r, c));
          entity = null;
          break;
        case '~': entity = new Water(r, c); break;
        case 'P':
          w.doors.push(new Door(r, c, 0));
          entity = null;
          break;
        case 'Y':
          w.doors.push(new Door(r, c, 1));
          entity = null;
          break;
        case 'p':
          w.switches.push(new Switch(r, c, 0));
          entity = null;
          break;
        case 'y':
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
        case 'M':
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
      const existing = w.grid[r] && w.grid[r][c];
      if (existing && (existing instanceof Wall)) continue;

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

/**
 * 获取一个格子对应的地图字符（仅地面元素，不包括角色/怪物/箱子等可移动实体）
 * @param {import('./world.js').World} w
 * @param {number} r
 * @param {number} c
 * @returns {string|null} 字符，如果没有特殊地面元素返回 null
 */
function getFloorChar(w, r, c) {
  if (w.targets.some(t => t.r === r && t.c === c)) return 'T';
  if (w.switches.some(s => s.r === r && s.c === c)) {
    const sw = w.switches.find(s => s.r === r && s.c === c);
    return sw.color === 0 ? 'p' : 'y';
  }
  if (w.doors.some(d => d.r === r && d.c === c)) {
    const dr = w.doors.find(d => d.r === r && d.c === c);
    return dr.color === 0 ? 'P' : 'Y';
  }
  if (w.monsterGates.some(g => g.r === r && g.c === c)) return 'M';
  return null;
}

/**
 * 获取可移动实体的地图字符
 * @param {import('./world.js').World} w
 * @param {number} r
 * @param {number} c
 * @returns {string|null}
 */
function getEntityChar(entity) {
  if (!entity) return null;
  if (entity instanceof Wall) return 'W';
  if (entity instanceof Box) return 'X';
  if (entity instanceof Water) return '~';
  if (entity instanceof Goblin) return 'G';
  if (entity instanceof FireDragon) {
    const dirs = ['F', 'R', 'D', 'L'];
    return dirs[entity.dir] || 'F';
  }
  if (entity instanceof Warrior) return '0';
  if (entity instanceof Thief) return '1';
  if (entity instanceof Mage) return '2';
  if (entity instanceof Priest) return '3';
  return null;
}

/**
 * 从 World 实例导出字符地图 + overlays
 * 正确保留地面元素（Target/Switch）与站在上面的可移动实体
 * @param {import('./world.js').World} w
 * @returns {{map: string[], overlays: Array<{char: string, r: number, c: number}>}}
 */
export function exportMapFromWorld(w) {
  const rows = w.rows;
  const cols = w.cols;
  const map = [];
  const overlays = [];
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) {
      const entity = w.grid[r][c];
      const floorChar = getFloorChar(w, r, c);
      const entityChar = getEntityChar(entity);

      // 静态实体（墙、水）直接写
      if (entity instanceof Wall || entity instanceof Water) {
        row += entityChar;
        continue;
      }

      if (entityChar) {
        // 可移动实体（角色/怪物/箱子）站在格子表面
        // 如果下面还有地面元素（Target/Switch/门），把地面元素写入地图，实体放到 overlays
        if (floorChar) {
          row += floorChar;
          overlays.push({ char: entityChar, r, c });
        } else {
          row += entityChar;
        }
      } else {
        // 格子上没有可移动实体，直接写地面元素或 '.'
        row += floorChar || '.';
      }
    }
    map.push(row);
  }
  return { map, overlays };
}

/**
 * 设置画布尺寸
 * @param {number} rows
 * @param {number} cols
 * @param {HTMLCanvasElement} canvas
 */
export function setGridSizes(rows, cols, canvas) {
  const maxW = Math.min(window.innerWidth - 80, 720);
  const maxH = Math.min(window.innerHeight - 260, 520);
  const ts = Math.max(24, Math.floor(Math.min(maxW / cols, maxH / rows)));
  canvas.width = cols * ts;
  canvas.height = rows * ts;
  return ts;
}