// ============================================================
// 游戏状态管理 — 全局状态
// ============================================================

// 关卡数据
export let levels = [];
export let customLevels = [];
export let currentLevelIdx = 0;

// 格子尺寸
export let tileSize = 48;
export let gameCols = 0;
export let gameRows = 0;

// 状态更新函数
export function setLevels(arr) {
  levels = arr;
}

export function setCustomLevels(arr) {
  customLevels = arr;
}

export function setCurrentLevelIdx(idx) {
  currentLevelIdx = idx;
}

export function setTileSize(ts) {
  tileSize = ts;
}

export function setGridSizes(rows, cols) {
  gameRows = rows;
  gameCols = cols;
}

// 重置关卡缓存
export function pushCustomLevel(lvl) {
  customLevels.push(lvl);
  levels.push(lvl);
}

/**
 * 从 JSON 文件加载关卡数据
 */
export async function loadLevels() {
  try {
    const r = await fetch('levels/builtin-levels.json');
    const data = await r.json();
    setLevels(data);
  } catch (e) {
    console.warn(e);
    setLevels([]);
  }
  try {
    const r2 = await fetch('levels/custom-levels.json');
    const cl = await r2.json();
    if (Array.isArray(cl) && cl.length > 0) {
      setCustomLevels(cl);
      levels.push(...cl);
    }
  } catch (e) {
    // 自定义关卡文件可能不存在
  }
}
