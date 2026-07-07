// ============================================================
// 关卡编辑器 — 用于创建和编辑自定义关卡
// ============================================================
import {
  Wall, Box, Water,
  Goblin, FireDragon,
  Warrior, Thief, Mage, Priest,
} from './entity.js';
import { World } from './world.js';
import { parseMapToWorld, exportMapFromWorld } from './levelLoader.js';
import { getWorld, setWorld, loadLevel, render } from './gameController.js';
import {
  levels, currentLevelIdx, setCurrentLevelIdx,
  customLevels, pushCustomLevel,
} from './gameState.js';
import { getGameCanvas } from './canvas.js';
import { setGlobalCtx } from './world.js';

// ---- 编辑状态 ----
let editing = false;
let editGrid = null;
let editRows = 0;
let editCols = 0;
let brush = '.';  // 默认地板
let editMode = 'draw'; // 'draw' | 'fill'

const BRUSH_BUTTONS = {
  'W': '墙', '.': '地板', 'X': '箱子', 'T': '目标',
  '~': '水面', 'P': '紫门', 'Y': '黄门',
  'p': '紫开关', 'y': '黄开关',
  '0': '战士', '1': '盗贼', '2': '法师', '3': '牧师',
  'G': '哥布林', 'F': '火龙(上)', 'R': '火龙(右)',
  'D': '火龙(下)', 'L': '火龙(左)', 'M': '怪物门',
};

export function isEditing() {
  return editing;
}

export function enterEditMode() {
  if (editing) return;
  const w = getWorld();
  if (!w) return;
  editRows = w.rows;
  editCols = w.cols;
  // 从当前世界导出地图
  editGrid = [];
  for (let r = 0; r < editRows; r++) {
    editGrid[r] = [];
    for (let c = 0; c < editCols; c++) {
      const entity = w.grid[r][c];
      let ch = '.';
      if (entity) {
        if (entity instanceof Wall) ch = 'W';
        else if (entity instanceof Box) ch = 'X';
        else if (entity instanceof Water) ch = '~';
        else if (entity instanceof Goblin) ch = 'G';
        else if (entity instanceof FireDragon) {
          const dirs = ['F', 'R', 'D', 'L'];
          ch = dirs[entity.dir] || 'F';
        }
        else if (entity instanceof Warrior) ch = '0';
        else if (entity instanceof Thief) ch = '1';
        else if (entity instanceof Mage) ch = '2';
        else if (entity instanceof Priest) ch = '3';
      }
      if (ch === '.') {
        if (w.targets.some(t => t.r === r && t.c === c)) ch = 'T';
        else if (w.switches.some(s => s.r === r && s.c === c)) {
          const sw = w.switches.find(s => s.r === r && s.c === c);
          ch = sw.color === 0 ? 'p' : 'y';
        }
        else if (w.doors.some(d => d.r === r && d.c === c)) {
          const dr = w.doors.find(d => d.r === r && d.c === c);
          ch = dr.color === 0 ? 'P' : 'Y';
        }
        else if (w.monsterGates.some(g => g.r === r && g.c === c)) ch = 'M';
      }
      editGrid[r][c] = ch;
    }
  }
  editing = true;
  renderEditGrid();
  document.getElementById('editorToolbar').style.display = 'flex';
  document.getElementById('gameToolbar').style.display = 'none';
}

export function exitEditMode() {
  editing = false;
  document.getElementById('editorToolbar').style.display = 'none';
  document.getElementById('gameToolbar').style.display = 'flex';
  // 重新加载当前关卡
  loadLevel(currentLevelIdx);
}

export function saveEditedLevel() {
  if (!editing) return;
  const name = prompt('输入关卡名称:', '自定义关卡 ' + (customLevels.length + 1));
  if (!name) return;
  const map = [];
  for (let r = 0; r < editRows; r++) {
    map.push(editGrid[r].join(''));
  }
  const newLevel = { name, map };
  pushCustomLevel(newLevel);
  exitEditMode();
  setCurrentLevelIdx(levels.length - 1);
  loadLevel(levels.length - 1);
}

function renderEditGrid() {
  if (!editGrid) return;
  const { canvas, ctx } = getGameCanvas();
  const ts = Math.max(20, Math.floor(Math.min(600 / editCols, 400 / editRows)));
  canvas.width = editCols * ts;
  canvas.height = editRows * ts;
  // 临时 World 用于渲染
  const rawMap = editGrid.map(row => row.join(''));
  const w = parseMapToWorld(rawMap, []);
  w.tileSize = ts;
  // 设置全局 ctx 并渲染
  setGlobalCtx(ctx);
  w.render();
  // 绘制网格线
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= editRows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * ts);
    ctx.lineTo(editCols * ts, r * ts);
    ctx.stroke();
  }
  for (let c = 0; c <= editCols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * ts, 0);
    ctx.lineTo(c * ts, editRows * ts);
    ctx.stroke();
  }
  setGlobalCtx(ctx);
}

export function editCell(row, col) {
  if (!editing || !editGrid) return;
  if (row < 0 || row >= editRows || col < 0 || col >= editCols) return;
  if (editMode === 'draw') {
    editGrid[row][col] = brush;
    renderEditGrid();
  } else if (editMode === 'fill') {
    const target = editGrid[row][col];
    if (target !== brush) {
      floodFill(row, col, target, brush);
      renderEditGrid();
    }
  }
}

function floodFill(r, c, from, to) {
  if (r < 0 || r >= editRows || c < 0 || c >= editCols) return;
  if (editGrid[r][c] !== from) return;
  editGrid[r][c] = to;
  floodFill(r - 1, c, from, to);
  floodFill(r + 1, c, from, to);
  floodFill(r, c - 1, from, to);
  floodFill(r, c + 1, from, to);
}

export function resizeEditGrid(newRows, newCols) {
  if (!editing) return;
  const oldRows = editRows;
  const oldCols = editCols;
  const newGrid = [];
  for (let r = 0; r < newRows; r++) {
    newGrid[r] = [];
    for (let c = 0; c < newCols; c++) {
      if (r < oldRows && c < oldCols) {
        newGrid[r][c] = editGrid[r][c];
      } else {
        newGrid[r][c] = '.';
      }
    }
  }
  editGrid = newGrid;
  editRows = newRows;
  editCols = newCols;
  renderEditGrid();
}

export function setBrush(ch) {
  brush = ch;
}

export function setEditMode(mode) {
  editMode = mode;
}

// ---- 设置编辑器工具栏按钮 ----
export function setupEditorButtons() {
  document.getElementById('editToolBtn').addEventListener('click', () => {
    if (editing) exitEditMode();
    else enterEditMode();
  });
  document.getElementById('editSaveBtn').addEventListener('click', saveEditedLevel);
  document.getElementById('editCancelBtn').addEventListener('click', exitEditMode);
  document.getElementById('brushFloor').addEventListener('click', () => setBrush('.'));
  document.getElementById('brushWall').addEventListener('click', () => setBrush('W'));
  document.getElementById('brushBox').addEventListener('click', () => setBrush('X'));
  document.getElementById('brushTarget').addEventListener('click', () => setBrush('T'));
  document.getElementById('brushWater').addEventListener('click', () => setBrush('~'));
  document.getElementById('brushDoorP').addEventListener('click', () => setBrush('P'));
  document.getElementById('brushDoorY').addEventListener('click', () => setBrush('Y'));
  document.getElementById('brushSwitchP').addEventListener('click', () => setBrush('p'));
  document.getElementById('brushSwitchY').addEventListener('click', () => setBrush('y'));
  document.getElementById('brushWarr').addEventListener('click', () => setBrush('0'));
  document.getElementById('brushThief').addEventListener('click', () => setBrush('1'));
  document.getElementById('brushMage').addEventListener('click', () => setBrush('2'));
  document.getElementById('brushPriest').addEventListener('click', () => setBrush('3'));
  document.getElementById('brushGoblin').addEventListener('click', () => setBrush('G'));
  document.getElementById('brushDragonU').addEventListener('click', () => setBrush('F'));
  document.getElementById('brushDragonR').addEventListener('click', () => setBrush('R'));
  document.getElementById('brushDragonD').addEventListener('click', () => setBrush('D'));
  document.getElementById('brushDragonL').addEventListener('click', () => setBrush('L'));
  document.getElementById('brushMonsterGate').addEventListener('click', () => setBrush('M'));
  document.getElementById('editFillBtn').addEventListener('click', () => setEditMode('fill'));
  document.getElementById('editDrawBtn').addEventListener('click', () => setEditMode('draw'));
  document.getElementById('editResizeBtn').addEventListener('click', () => {
    const newRows = parseInt(prompt('行数:', editRows)) || editRows;
    const newCols = parseInt(prompt('列数:', editCols)) || editCols;
    resizeEditGrid(newRows, newCols);
  });
}