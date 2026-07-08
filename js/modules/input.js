 // ============================================================
// 输入模块 — 键盘 / 鼠标 / 触控 事件处理
// ============================================================
import { movePlayer, restartLevel, loadLevel, undo } from './gameController.js';
import { currentLevelIdx, levels } from './gameState.js';
import { getGameCanvas } from './canvas.js';
import { isEditing, editCell, getEditTileSize, isTestMode, returnToEditor } from './editor.js';
import { dismissOverlays, renderLevelGrid, showScreen } from './ui.js';

// ---- 键盘映射 ----
/** @type {Object<string, [number, number]>} */
const KEY_MAP = {
  'ArrowUp': [-1, 0],
  'ArrowDown': [1, 0],
  'ArrowLeft': [0, -1],
  'ArrowRight': [0, 1],
  'w': [-1, 0],
  's': [1, 0],
  'a': [0, -1],
  'd': [0, 1],
};

/**
 * 设置键盘监听
 */
export function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && key === 'z') {
      e.preventDefault();
      restartLevel();
      return;
    }

    const dir = KEY_MAP[key];
    if (dir && !ctrl) {
      e.preventDefault();
      if (isEditing()) return;

      const [dr, dc] = dir;
      // 先尝试使用左侧 shift 切换角色（如果存在其他角色）
      // 直接移动
      movePlayer(dr, dc);
    }

    // 数字键选择角色（在字符按钮上）
    if (key >= '1' && key <= '4') {
      const idx = parseInt(key) - 1;
      const btn = document.querySelector(`.char-btn[data-char="${idx}"]`);
      if (btn && !btn.classList.contains('disabled')) {
        btn.click();
      }
    }

    // 空格/回车 关闭覆盖层
    if (key === ' ' || key === 'Enter') {
      const victory = document.getElementById('victoryOverlay');
      const death = document.getElementById('deathOverlay');
      if (victory.classList.contains('show')) {
        e.preventDefault();
        const nextBtn = document.getElementById('victoryNextBtn');
        if (nextBtn.style.display !== 'none') {
          nextBtn.click();
        } else {
          dismissOverlays();
          loadLevel(currentLevelIdx);
        }
        return;
      }
      if (death.classList.contains('show')) {
        e.preventDefault();
        document.getElementById('deathRestartBtn').click();
        return;
      }
    }

    // Q / Tab 键切换角色
    if (key === 'Tab' || key === 'q') {
      e.preventDefault();
      document.getElementById('switchBtn').click();
    }

    // R 重置关卡
    if (key === 'r' && !ctrl) {
      e.preventDefault();
      document.getElementById('restartBtn').click();
    }

    // Z 打开选关界面
    if (key === 'z' && !ctrl) {
      e.preventDefault();
      renderLevelGrid();
      showScreen('selectScreen');
    }

    // E 撤销上一步
    if (key === 'e' && !ctrl) {
      e.preventDefault();
      undo();
    }

    // C 进入编辑器 / 测试模式返回
    if (key === 'c' && !ctrl) {
      e.preventDefault();
      if (isTestMode()) {
        returnToEditor();
      } else {
        document.getElementById('editToolBtn').click();
      }
    }
  });
}

/**
 * 设置画布鼠标/触控事件（用于编辑器绘制）
 */
export function setupCanvasInput() {
  const { canvas } = getGameCanvas();
  let drawing = false;

  /**
   * 根据鼠标坐标计算所在格子位置
   * @param {number} clientX
   * @param {number} clientY
   * @returns {{row: number, col: number}}
   */
  const getTilePos = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    // 使用编辑器实际的 tile size，游戏模式下 fallback 到 48（不会触发编辑）
    const ts = getEditTileSize() || 48;
    return {
      row: Math.floor(y / ts),
      col: Math.floor(x / ts),
    };
  };

  canvas.addEventListener('mousedown', (e) => {
    if (!isEditing()) return;
    drawing = true;
    const { row, col } = getTilePos(e.clientX, e.clientY);
    editCell(row, col);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!drawing || !isEditing()) return;
    const { row, col } = getTilePos(e.clientX, e.clientY);
    editCell(row, col);
  });

  canvas.addEventListener('mouseup', () => {
    drawing = false;
  });

  canvas.addEventListener('mouseleave', () => {
    drawing = false;
  });

  // 触控支持
  canvas.addEventListener('touchstart', (e) => {
    if (!isEditing()) return;
    e.preventDefault();
    drawing = true;
    const touch = e.touches[0];
    const { row, col } = getTilePos(touch.clientX, touch.clientY);
    editCell(row, col);
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!drawing || !isEditing()) return;
    e.preventDefault();
    const touch = e.touches[0];
    const { row, col } = getTilePos(touch.clientX, touch.clientY);
    editCell(row, col);
  });

  canvas.addEventListener('touchend', () => {
    drawing = false;
  });
}