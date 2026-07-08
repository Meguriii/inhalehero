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
  customLevels, pushCustomLevel, setLevels,
} from './gameState.js';
import { getGameCanvas } from './canvas.js';
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
  // 清空为纯地面，让用户从空白开始编辑
  editGrid = [];
  for (let r = 0; r < editRows; r++) {
    editGrid[r] = [];
    for (let c = 0; c < editCols; c++) {
      editGrid[r][c] = '.';
    }
  }
  editing = true;
  renderEditGrid();
  document.getElementById('editorToolbar').style.display = 'flex';
  document.getElementById('gameToolbar').style.display = 'none';
  document.getElementById('bottomNav').style.display = 'none';
  // 关闭可能残留的覆盖层
  document.getElementById('victoryOverlay').classList.remove('show');
  document.getElementById('deathOverlay').classList.remove('show');
  // 默认高亮地板按钮
  setBrush('.');
}

export function exitEditMode() {
  editing = false;
  document.getElementById('editorToolbar').style.display = 'none';
  document.getElementById('gameToolbar').style.display = 'flex';
  document.getElementById('bottomNav').style.display = 'flex';
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

/** @type {number} 缓存当前格子的像素尺寸 */
let _editTs = 0;

/** 获取编辑器当前格子像素尺寸 */
export function getEditTileSize() {
  return _editTs;
}
/** @type {import('./world.js').World|null} 编辑器缓存的游戏风格世界（用于增量重绘） */
let _editWorld = null;

/** 从 editGrid 重建 _editWorld 并返回 */
function rebuildEditWorld() {
  if (!editGrid) return null;
  const lines = editGrid.map(row => row.join(''));
  const w = parseMapToWorld(lines, []);
  w.tileSize = _editTs;
  return w;
}

function renderEditGrid() {
  if (!editGrid) return;
  const { canvas, ctx } = getGameCanvas();
  _editTs = Math.max(20, Math.floor(Math.min(600 / editCols, 400 / editRows)));
  const ts = _editTs;
  canvas.width = editCols * ts;
  canvas.height = editRows * ts;

  // 清空画布，防止残留之前游戏的渲染内容
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 用游戏引擎渲染编辑网格——视觉风格与游戏完全一致
  _editWorld = rebuildEditWorld();
  if (_editWorld) {
    _editWorld.render(ctx);
  }

  // 用半透明边框绘制网格线（叠加在游戏渲染之上）
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let r = 0; r <= editRows; r++) {
    ctx.moveTo(0, r * ts);
    ctx.lineTo(editCols * ts, r * ts);
  }
  for (let c = 0; c <= editCols; c++) {
    ctx.moveTo(c * ts, 0);
    ctx.lineTo(c * ts, editRows * ts);
  }
  ctx.stroke();
}

export function editCell(row, col) {
  if (!editing || !editGrid) return;
  if (row < 0 || row >= editRows || col < 0 || col >= editCols) return;
  if (editMode === 'draw') {
    if (editGrid[row][col] === brush) return;
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
  // 更新按钮高亮
  document.querySelectorAll('#editorToolbar .tile-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === idForBrush(ch));
  });
}

/** 根据笔刷字符反查按钮 ID */
function idForBrush(ch) {
  const map = {
    '.': 'brushFloor', 'W': 'brushWall', 'X': 'brushBox', 'T': 'brushTarget',
    '~': 'brushWater', 'P': 'brushDoorP', 'Y': 'brushDoorY',
    'p': 'brushSwitchP', 'y': 'brushSwitchY',
    '0': 'brushWarr', '1': 'brushThief', '2': 'brushMage', '3': 'brushPriest',
    'G': 'brushGoblin', 'F': 'brushDragonU', 'R': 'brushDragonR',
    'D': 'brushDragonD', 'L': 'brushDragonL', 'M': 'brushMonsterGate',
  };
  return map[ch] || '';
}

export function setEditMode(mode) {
  editMode = mode;
}

/** 保存进入测试前的编辑器状态（用于测试结束后恢复） */
let _savedEditState = null;

/**
 * 测试编辑中的关卡
 * 用编辑网格创建世界并加载到游戏引擎中运行
 */
export function testPlay() {
  if (!editing) return;
  // 保存当前编辑状态
  _savedEditState = {
    editGrid: editGrid.map(row => [...row]),
    editRows,
    editCols,
    brush,
    editMode,
  };
  // 从 editGrid 构建关卡字符串
  const map = editGrid.map(row => row.join(''));
  // 临时加到 levels 末尾
  const newLevel = { name: '[测试]', map };
  const testIdx = levels.length;
  setLevels([...levels, newLevel]);
  _testLevelIdx = testIdx;
  // 退出编辑模式
  editing = false;
  document.getElementById('editorToolbar').style.display = 'none';
  document.getElementById('gameToolbar').style.display = 'flex';
  document.getElementById('bottomNav').style.display = 'flex';
  // 加载测试关卡
  loadLevel(testIdx);
  // 显示提示——按 C 返回编辑器
  const hintBar = document.getElementById('hintBar');
  hintBar.style.display = 'flex';
  document.getElementById('hintText').textContent = '测试模式 — 按 C 返回编辑器';
}

/** @type {number|null} */
let _testLevelIdx = null;

/** 当前是否处于测试模式 */
export function isTestMode() {
  return _testLevelIdx !== null;
}

export function returnToEditor() {
  if (_testLevelIdx !== null) {
    // 从 levels 中移除测试关卡
    const newLevels = levels.filter((_, i) => i !== _testLevelIdx);
    setLevels(newLevels);
    _testLevelIdx = null;
  }
  // 恢复编辑状态
  if (!_savedEditState) return;
  editGrid = _savedEditState.editGrid;
  editRows = _savedEditState.editRows;
  editCols = _savedEditState.editCols;
  brush = _savedEditState.brush;
  editMode = _savedEditState.editMode;
  _savedEditState = null;

  editing = true;
  document.getElementById('editorToolbar').style.display = 'flex';
  document.getElementById('gameToolbar').style.display = 'none';
  document.getElementById('bottomNav').style.display = 'none';
  document.getElementById('hintBar').style.display = 'none';
  // 重绘编辑器画布
  renderEditGrid();
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
  document.getElementById('editTestBtn').addEventListener('click', testPlay);
}
