// ============================================================
// gameState 模块测试
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import {
  levels, customLevels, currentLevelIdx,
  getState, setLevels, setCustomLevels,
  setCurrentLevelIdx, pushCustomLevel,
} from '../js/modules/gameState.js';

describe('gameState', () => {
  beforeEach(() => {
    // 重置到初始状态
    setLevels([]);
    setCustomLevels([]);
    setCurrentLevelIdx(0);
  });

  it('初始状态为空', () => {
    expect(levels).toEqual([]);
    expect(customLevels).toEqual([]);
    expect(currentLevelIdx).toBe(0);
  });

  it('getState 返回快照', () => {
    const s = getState();
    expect(s).toHaveProperty('levels');
    expect(s).toHaveProperty('customLevels');
    expect(s).toHaveProperty('currentLevelIdx');
  });

  it('setLevels 替换关卡列表', () => {
    const lvls = [{ name: 'Test', map: 'WALL' }];
    setLevels(lvls);
    expect(levels).toEqual(lvls);
    expect(levels).not.toBe(lvls); // 验证不共享引用（由 setter 赋值新值）
  });

  it('setCustomLevels 替换自定义关卡列表', () => {
    const cl = [{ name: 'Custom', map: 'FLOOR' }];
    setCustomLevels(cl);
    expect(customLevels).toEqual(cl);
  });

  it('setCurrentLevelIdx 设置索引', () => {
    setCurrentLevelIdx(2);
    expect(currentLevelIdx).toBe(2);
  });

  it('pushCustomLevel 追加关卡', () => {
    setLevels([{ name: 'A', map: '' }]);
    setCustomLevels([]);
    const lvl = { name: 'B', map: '' };
    pushCustomLevel(lvl);
    expect(levels).toHaveLength(2);
    expect(levels[1]).toBe(lvl);
    expect(customLevels).toHaveLength(1);
  });
});