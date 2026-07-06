// ============================================================
// 推箱子 — 关卡编辑器
// ============================================================
const editCanvas = document.getElementById('editorCanvas');
const ectx = editCanvas.getContext('2d');
let editGrid = [], editRows = 10, editCols = 10, editTs = 40;
let currentTool = 'W';
const editorTiles = [
  { key: 'W', label: '墙', color: '#5a5a7a' },
  { key: '.', label: '空', color: '#2a2a40' },
  { key: 'X', label: '箱', color: '#8B5A2B' },
  { key: 'T', label: '目标', color: '#FFD700' },
  { key: '~', label: '水', color: '#3498DB' },
  { key: 'P', label: '紫门', color: '#9B59B6' },
  { key: 'Y', label: '黄门', color: '#F1C40F' },
  { key: 'p', label: '紫开关', color: '#AF7AC5' },
  { key: 'y', label: '黄开关', color: '#F9E79F' },
  { key: '0', label: '战士', color: '#E74C3C' },
  { key: '1', label: '盗贼', color: '#2ECC71' },
  { key: '2', label: '法师', color: '#3498DB' },
  { key: '3', label: '牧师', color: '#F0F0FF' },
  { key: 'G', label: '哥布林', color: '#2d8a4e' },
  { key: 'F', label: '龙↑', color: '#E74C3C' },
  { key: 'R', label: '龙→', color: '#E74C3C' },
  { key: 'D', label: '龙↓', color: '#E74C3C' },
  { key: 'L', label: '龙←', color: '#E74C3C' },
  { key: 'M', label: '怪物门', color: '#E91E63' },
];

let needInitEditor = true;
function initEditor() {
  if (!needInitEditor) { renderEditor(); return; }
  needInitEditor = false;
  document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.tile-btn[data-tile="wall"]').classList.add('active');
  editBrush = 'W';
  editGrid = [];
  for (let r = 0; r < editRows; r++) {
    editGrid[r] = [];
    for (let c = 0; c < editCols; c++) editGrid[r][c] = r === 0 || r === editRows - 1 || c === 0 || c === editCols - 1 ? 'W' : '.';
  }
  renderEditor();
}

function renderEditor() {
  if (!editGrid.length) return;
  editTs = Math.max(20, Math.floor(Math.min(680 / editCols, 480 / editRows)));
  editCanvas.width = editCols * editTs; editCanvas.height = editRows * editTs;
  const ctx = ectx, ts = editTs;
  for (let r = 0; r < editRows; r++) for (let c = 0; c < editCols; c++) {
    const ch = editGrid[r][c], x = c * ts, y = r * ts;
    drawFloor(ctx, x, y, ts);
    switch (ch) {
      case 'W': drawWall(ctx, x, y, ts); break;
      case 'X': drawBox(ctx, x, y, ts); break;
      case 'T': drawTarget(ctx, x, y, ts); break;
      case '~': drawWater(ctx, x, y, ts); break;
      case 'P': drawDoor(ctx, x, y, ts, 0, false); break;
      case 'Y': drawDoor(ctx, x, y, ts, 1, false); break;
      case 'p': drawSwitch(ctx, x, y, ts, 0, false); break;
      case 'y': drawSwitch(ctx, x, y, ts, 1, false); break;
      case '0': drawChar(ctx, x, y, ts, WARRIOR, false); break;
      case '1': drawChar(ctx, x, y, ts, THIEF, false); break;
      case '2': drawChar(ctx, x, y, ts, MAGE, false); break;
      case '3': drawChar(ctx, x, y, ts, PRIEST, false); break;
      case 'G': drawGoblin(ctx, x, y, ts); break;
      case 'F': drawDragon(ctx, x, y, ts, 0); break;
      case 'R': drawDragon(ctx, x, y, ts, 1); break;
      case 'D': drawDragon(ctx, x, y, ts, 2); break;
      case 'L': drawDragon(ctx, x, y, ts, 3); break;
      case 'M': drawMonsterGate(ctx, x, y, ts, false); break;
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= editRows; r++) { ctx.beginPath(); ctx.moveTo(0, r * ts); ctx.lineTo(editCols * ts, r * ts); ctx.stroke(); }
  for (let c = 0; c <= editCols; c++) { ctx.beginPath(); ctx.moveTo(c * ts, 0); ctx.lineTo(c * ts, editRows * ts); ctx.stroke(); }
}

function editTile(r, c, val) {
  if (r < 0 || r >= editRows || c < 0 || c >= editCols) return;
  // Convert numeric brush to character
  if (typeof val === 'number') {
    if (val >= CHAR_TILE_BASE && val < CHAR_TILE_BASE + 4) {
      // Character tiles: 30, 31, 32, 33 → '0', '1', '2', '3'
      editGrid[r][c] = String(val - CHAR_TILE_BASE);
    } else {
      // Other numeric: look up in TILE_CHARS
      const entry = Object.entries(TILE_CHARS).find(([k, v]) => parseInt(k) === val);
      if (entry) editGrid[r][c] = entry[1];
      else editGrid[r][c] = '.';
    }
  } else {
    editGrid[r][c] = val;
  }
  renderEditor();
}

editCanvas.addEventListener('click', (e) => {
  const rect = editCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const c = Math.floor(mx / editTs), r = Math.floor(my / editTs);
  editTile(r, c, editBrush);
});

let editMouseDown = false;
editCanvas.addEventListener('mousedown', (e) => { editMouseDown = true; const rect = editCanvas.getBoundingClientRect(); const c = Math.floor((e.clientX - rect.left) / editTs), r = Math.floor((e.clientY - rect.top) / editTs); editTile(r, c, editBrush); });
editCanvas.addEventListener('mouseup', () => { editMouseDown = false; });
editCanvas.addEventListener('mouseleave', () => { editMouseDown = false; });
editCanvas.addEventListener('mousemove', (e) => {
  if (!editMouseDown) return;
  const rect = editCanvas.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / editTs), r = Math.floor((e.clientY - rect.top) / editTs);
  editTile(r, c, editBrush);
});

function resizeEditor(r, c) {
  if (r < 3 || r > 20 || c < 3 || c > 20) return;
  editRows = r; editCols = c;
  const ng = [];
  for (let ri = 0; ri < editRows; ri++) {
    ng[ri] = [];
    for (let ci = 0; ci < editCols; ci++) {
      ng[ri][ci] = (editGrid[ri] && editGrid[ri][ci] !== undefined) ? editGrid[ri][ci] : (ri === 0 || ri === editRows - 1 || ci === 0 || ci === editCols - 1 ? 'W' : '.');
    }
  }
  editGrid = ng; renderEditor();
}

function exportLevel() {
  return editGrid.map(r => r.join(''));
}
function editorGetMap() { return exportLevel(); }

function importLevel(map) { editGrid = map.map(r => r.split('')); editRows = editGrid.length; editCols = editGrid[0].length; renderEditor(); }
function editorLoadMap(map) { importLevel(map); }
