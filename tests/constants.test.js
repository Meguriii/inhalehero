// ============================================================
// constants 模块测试
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  EMPTY, WALL, BOX, TARGET, WATER,
  DOOR_PURPLE, DOOR_YELLOW,
  SWITCH_PURPLE, SWITCH_YELLOW,
  WARRIOR, THIEF, MAGE, PRIEST,
  GOBLIN, FIRE_DRAGON,
  C,
} from '../js/modules/constants.js';

describe('constants', () => {
  it('定义了所有 tile 常量', () => {
    expect(EMPTY).toBe(0);
    expect(WALL).toBe(1);
    expect(BOX).toBe(2);
    expect(TARGET).toBe(3);
    expect(WATER).toBe(6);
    expect(DOOR_PURPLE).toBe(10);
    expect(DOOR_YELLOW).toBe(11);
    expect(SWITCH_PURPLE).toBe(20);
    expect(SWITCH_YELLOW).toBe(21);
  });

  it('定义了角色类型常量', () => {
    expect(WARRIOR).toBe(0);
    expect(THIEF).toBe(1);
    expect(MAGE).toBe(2);
    expect(PRIEST).toBe(3);
    expect(GOBLIN).toBe(40);
    expect(FIRE_DRAGON).toBe(41);
  });

  it('C 对象包含所有颜色常量', () => {
    expect(C.floor1).toBeDefined();
    expect(C.wall1).toBeDefined();
    expect(C.box1).toBeDefined();
    expect(C.target1).toBeDefined();
    expect(C.black).toBe('#1a1a2e');
    expect(C.white).toBe('#e8e8f0');
  });

  it('精灵数组长度为 4（四种角色）', () => {
    const { SPRITES, SPRITES_SLEEP } = (await import('../js/modules/constants.js'));
    expect(SPRITES).toHaveLength(4);
    expect(SPRITES_SLEEP).toHaveLength(4);
  });
});