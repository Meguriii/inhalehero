// ============================================================
// 游戏控制器 — 移动逻辑 / 关卡加载 / 渲染调度 / 撤销
// ============================================================
import { levels, currentLevelIdx, setCurrentLevelIdx } from './gameState.js';
import {
  parseMapToWorld, setGridSizes as calcGridSizes,
  exportMapFromWorld,
} from './levelLoader.js';
import { getGameCanvas } from './canvas.js';
import { dismissOverlays } from './ui.js';
import { isEditing } from './editor.js';

/** @type {import('./world.js').World|null} 当前世界实例 */
let gameWorld = null;

// ---- 撤销历史 ----
/**
 * 撤销历史栈，每个条目保存 { map, overlays, activeCharIdx, moveCount }
 * @type {Array<{map: string[], overlays: Array<{char: string, r: number, c: number}>, activeCharIdx: number, moveCount: number}>}
 */
let undoHistory = [];

/** 最大撤销步数 */
const MAX_UNDO = 64;

/**
 * 保存当前世界快照到撤销栈
 */
function saveUndoSnapshot() {
  if (!gameWorld) return;
  const { map, overlays } = exportMapFromWorld(gameWorld);
  undoHistory.push({
    map,
    overlays,
    activeCharIdx: gameWorld.activeCharIdx,
    moveCount: gameWorld.moveCount,
  });
  if (undoHistory.length > MAX_UNDO) {
    undoHistory.shift();
  }
}

/**
 * 撤销：恢复到上一步状态
 * @returns {boolean} 是否成功撤销
 */
export function undo() {
  if (undoHistory.length === 0 || !gameWorld) return false;
  const snapshot = undoHistory.pop();
  if (!snapshot) return false;

  // 保留旧世界的死亡/胜利回调，传递给新世界
  const oldOnDeath = gameWorld.onDeath;
  const oldOnWin = gameWorld.onWin;

  const w = parseMapToWorld(snapshot.map, snapshot.overlays || []);
  const { canvas } = getGameCanvas();
  const ts = calcGridSizes(w.rows, w.cols, canvas);
  w.tileSize = ts;
  w.activeCharIdx = snapshot.activeCharIdx;
  w.moveCount = snapshot.moveCount;

  // 恢复回调
  w.setDeathCallback(oldOnDeath);
  w.setWinCallback(oldOnWin);

  // 重置游戏结束/胜利状态（撤销恢复到之前的状态）
  w.gameOver = false;
  w.won = false;

  // 重新计算门状态
  w.updateDoorStates();
  w.updateMonsterGates();

  setWorld(w);

  // 关闭任何覆盖层（死亡/胜利）
  dismissOverlays();

  if (onUIUpdate) onUIUpdate();
  render();
  return true;
}

/**
 * 清空撤销历史（加载新关卡时调用）
 */
export function clearUndoHistory() {
  undoHistory = [];
}

/**
 * 获取当前世界实例
 * @returns {import('./world.js').World|null}
 */
export function getWorld() {
  return gameWorld;
}

/**
 * 设置当前世界实例
 * @param {import('./world.js').World|null} w
 */
export function setWorld(w) {
  gameWorld = w;
}

/**
 * 移动当前活跃角色
 * @param {number} dr 行偏移
 * @param {number} dc 列偏移
 * @returns {boolean} 是否成功移动
 */
export function movePlayer(dr, dc) {
  const w = gameWorld;
  if (!w || w.won || w.gameOver) return false;
  const ch = w.getActiveCharacter();
  if (!ch) return false;

  // 在移动前保存快照（用于撤销）
  saveUndoSnapshot();

  if (ch.executeMove(w, dr, dc)) {
    w.moveCount++;
    w.updateDoorStates();
    w.updateMonsters();
    w.updateMonsterGates();
    w.checkWin();
    render();
    if (onUIUpdate) onUIUpdate();
    return true;
  } else {
    // 移动失败，丢弃刚才保存的快照
    undoHistory.pop();
  }
  return false;
}

/**
 * 加载指定索引的关卡
 * @param {number} index 关卡索引
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
  clearUndoHistory();

  if (onLevelLoad) onLevelLoad(raw, index);
  render();
}

/**
 * 渲染当前世界
 */
export function render() {
  // 编辑模式下跳过游戏渲染，防止覆盖编辑器画布
  if (isEditing()) return;
  const w = gameWorld;
  if (!w) return;
  const { ctx } = getGameCanvas();
  w.render(ctx);
  w.renderParticles(ctx);
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
 * 选择指定类型的角色
 * @param {number} idx 角色类型索引（0=Warrior, 1=Thief, 2=Mage, 3=Priest）
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
 * 切换到下一个活跃角色
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
/** @type {(() => void)|null} */
let onUIUpdate = null;
/** @type {((raw: import('./world.js').LevelData, index: number) => void)|null} */
let onLevelLoad = null;

/**
 * 注册 UI 更新回调
 * @param {() => void} cb
 */
export function setUICallback(cb) {
  onUIUpdate = cb;
}

/**
 * 注册关卡加载完成回调
 * @param {(raw: import('./world.js').LevelData, index: number) => void} cb
 */
export function setLevelLoadCallback(cb) {
  onLevelLoad = cb;
}

/**
 * 获取当前步数
 * @returns {number}
 */
export function getMoveCount() {
  return gameWorld ? gameWorld.moveCount : 0;
}

/**
 * 当前是否游戏结束
 * @returns {boolean}
 */
export function isGameOver() {
  return gameWorld ? gameWorld.gameOver : false;
}

/**
 * 当前是否胜利
 * @returns {boolean}
 */
export function isWon() {
  return gameWorld ? gameWorld.won : false;
}