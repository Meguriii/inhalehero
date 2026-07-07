// ============================================================
// Canvas 管理 — 提供画布获取与尺寸计算
// ============================================================

/**
 * 初始化游戏画布尺寸
 */
export function initCanvas() {
  const canvas = document.getElementById('game');
  if (canvas) {
    canvas.width = 720;
    canvas.height = 520;
  }
}

/**
 * 获取游戏画布和上下文
 * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}}
 */
export function getGameCanvas() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

/**
 * 获取编辑器画布和上下文
 * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}}
 */
export function getEditorCanvas() {
  const canvas = document.getElementById('editorCanvas');
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

/**
 * 根据格子数量和画布宽度计算 tileSize
 * @param {number} cols 列数
 * @param {number} rows 行数
 * @param {number} maxWidth 最大宽度
 * @param {number} maxHeight 最大高度
 * @returns {number} 计算出的 tileSize
 */
export function calcTileSize(cols, rows, maxWidth, maxHeight) {
  return Math.floor(Math.min(maxWidth / cols, maxHeight / rows));
}