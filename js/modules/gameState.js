// ============================================================
// 游戏状态管理 — 不可变状态容器
// 暴露 setter 函数确保状态变更可追踪，支持 getState() 快照
// 使用 export let 保持 ESM 实时绑定（import 方始终读到最新值）
// ============================================================

/** @type {import('./world.js').LevelData[]} */
export let levels = [];
/** @type {import('./world.js').LevelData[]} */
export let customLevels = [];
/** @type {number} */
export let currentLevelIdx = 0;

/**
 * 获取当前状态快照（用于测试/日志等只读场景）
 * @returns {{ levels: import('./world.js').LevelData[], customLevels: import('./world.js').LevelData[], currentLevelIdx: number }}
 */
export function getState() {
  return { levels, customLevels, currentLevelIdx };
}

/**
 * 替换整个关卡列表（新引用）
 * @param {import('./world.js').LevelData[]} arr
 */
export function setLevels(arr) {
  levels = arr;
}

/**
 * 替换自定义关卡列表（新引用）
 * @param {import('./world.js').LevelData[]} arr
 */
export function setCustomLevels(arr) {
  customLevels = arr;
}

/**
 * 设置当前关卡索引
 * @param {number} idx
 */
export function setCurrentLevelIdx(idx) {
  currentLevelIdx = idx;
}

/**
 * 追加自定义关卡（展开到新数组，不突变原数组引用）
 * @param {import('./world.js').LevelData} lvl
 */
export function pushCustomLevel(lvl) {
  levels = [...levels, lvl];
  customLevels = [...customLevels, lvl];
}

/**
 * 从 JSON 文件加载关卡数据并合并自定义关卡
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
      setLevels([...levels, ...cl]);
    }
  } catch (e) {
    // 自定义关卡文件可能不存在，忽略
  }
}