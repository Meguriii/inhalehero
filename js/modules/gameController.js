// ============================================================
// 游戏控制器 — 移动逻辑 / 关卡加载 / 渲染调度
// ============================================================
import {
  levels, currentLevelIdx, setCurrentLevelIdx,
  tileSize, setTileSize,
} from './gameState.js';
import {
  parseMapToWorld, setGridSizes as calcGridSizes,
} from './levelLoader.js';
import { getGameCanvas } from './canvas.js';

// 当前世界实例
let gameWorld = null;

export function getWorld() {
  return gameWorld;
}

export function setWorld(w) {
  gameWorld = w;
}

/**
 * 移动当前活跃角色
 */
export function movePlayer(dr, dc) {
  const w = gameWorld;
  if (!w || w.won || w.gameOver) return false;
  const ch = w.getActiveCharacter();
  if (!ch) return false;

  if (ch.executeMove(w, dr, dc)) {
    w.moveCount++;
    w.updateDoorStates();
    w.updateMonsters();
    w.updateMonsterGates();
    w.checkWin();
    render();
    if (onUIUpdate) onUIUpdate();
    return true;
  }
  return false;
}

/**
 * 加载关卡
 */
export function loadLevel(index) {
  const allLevels = levels;
  if (index >= allLevels.length) index = 0;
  setCurrentLevelIdx(index);
  const raw = allLevels[index];
  if (!raw || !raw.map || raw.map.length === 0) return;

  const w = parseMapToWorld(raw.map.slice(), raw.overlays);
  const { canvas } = getGameCanvas();
  const ts = calcGridSizes(w.rows, w.cols, canvas);
  w.tileSize = ts;
  w.activeCharIdx = 0;
  setWorld(w);
  setTileSize(ts);

  if (onLevelLoad) onLevelLoad(raw, index);
  render();
}

/**
 * 渲染
 */
export function render() {
  const w = gameWorld;
  if (!w) return;
  w.render();
  w.renderParticles();
}

/**
 * 动画循环帧更新
 */
export function updateFrame() {
  const w = gameWorld;
  if (w) {
    w.computeThreatenedTiles();
    w.updateParticles();
    w.updateMonsterGates();
  }
  render();
}

/**
 * 选择角色
 */
export function selectCharacter(idx) {
  const w = gameWorld;
  if (!w) return;
  for (let i = 0; i < w.characters.length; i++) {
    if (w.characters[i].type === idx) {
      w.activeCharIdx = i;
      if (onUIUpdate) onUIUpdate();
      render();
      return;
    }
  }
}

/**
 * 切换角色
 */
export function switchCharacter() {
  const w = gameWorld;
  if (w && w.characters.length > 0) {
    w.activeCharIdx = (w.activeCharIdx + 1) % w.characters.length;
    if (onUIUpdate) onUIUpdate();
    render();
  }
}

/**
 * 重新开始当前关卡
 */
export function restartLevel() {
  loadLevel(currentLevelIdx);
}

// ---- 回调 ----
let onUIUpdate = null;
let onLevelLoad = null;

export function setUICallback(cb) {
  onUIUpdate = cb;
}

export function setLevelLoadCallback(cb) {
  onLevelLoad = cb;
}

export function getMoveCount() {
  return gameWorld ? gameWorld.moveCount : 0;
}

export function isGameOver() {
  return gameWorld ? gameWorld.gameOver : false;
}

export function isWon() {
  return gameWorld ? gameWorld.won : false;
}