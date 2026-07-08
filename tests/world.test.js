// ============================================================
// world 模块测试
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../js/modules/world.js';
import { Wall, Box, Target, Water, Door, Switch, Warrior } from '../js/modules/entity.js';

describe('World', () => {
  let world;

  beforeEach(() => {
    world = new World(5, 6);
  });

  it('构造时设置行列和默认属性', () => {
    expect(world.rows).toBe(5);
    expect(world.cols).toBe(6);
    expect(world.grid).toHaveLength(0);
    expect(world.characters).toEqual([]);
    expect(world.targets).toEqual([]);
    expect(world.activeCharIdx).toBe(0);
    expect(world.won).toBe(false);
    expect(world.gameOver).toBe(false);
    expect(world.moveCount).toBe(0);
    expect(world.tileSize).toBe(48);
  });

  it('setEntity / getEntity 正常工作', () => {
    const w = new Wall(2, 3);
    world.setEntity(2, 3, w);
    const got = world.getEntity(2, 3);
    expect(got).toBe(w);
    expect(got.r).toBe(2);
    expect(got.c).toBe(3);
  });

  it('setEntity 更新实体坐标', () => {
    const b = new Box(0, 0);
    world.setEntity(4, 5, b);
    expect(b.r).toBe(4);
    expect(b.c).toBe(5);
  });

  it('getEntity 越界返回 null', () => {
    expect(world.getEntity(-1, 0)).toBeNull();
    expect(world.getEntity(0, -1)).toBeNull();
    expect(world.getEntity(5, 0)).toBeNull();
    expect(world.getEntity(0, 6)).toBeNull();
  });

  it('isEmptyTile 判断正确', () => {
    world.setEntity(1, 1, new Wall(1, 1));
    expect(world.isEmptyTile(1, 1)).toBe(false);
    expect(world.isEmptyTile(0, 0)).toBe(true);
  });

  it('isWalkable 根据实体类型返回', () => {
    world.setEntity(1, 1, new Wall(1, 1));
    world.setEntity(2, 2, new Target(2, 2));
    world.setEntity(3, 3, new Box(3, 3));
    expect(world.isWalkable(1, 1)).toBe(false); // Wall
    expect(world.isWalkable(2, 2)).toBe(true);  // Target
    expect(world.isWalkable(3, 3)).toBe(false); // Box
    expect(world.isWalkable(0, 0)).toBe(true);  // empty
  });

  it('isWalkable 越界返回 false', () => {
    expect(world.isWalkable(-1, 0)).toBe(false);
  });

  it('isSolid 根据实体类型返回', () => {
    world.setEntity(1, 1, new Wall(1, 1));
    world.setEntity(2, 2, new Target(2, 2));
    expect(world.isSolid(1, 1)).toBe(true); // Wall
    expect(world.isSolid(2, 2)).toBe(false); // Target
  });

  it('getTargetAt 查找目标', () => {
    const t = new Target(2, 3);
    world.targets.push(t);
    expect(world.getTargetAt(2, 3)).toBe(t);
    expect(world.getTargetAt(0, 0)).toBeNull();
  });

  it('getSwitchAt 查找开关', () => {
    const s = new Switch(1, 4, 0);
    world.switches.push(s);
    expect(world.getSwitchAt(1, 4)).toBe(s);
    expect(world.getSwitchAt(0, 0)).toBeNull();
  });

  it('closeDoor / openDoor 切换门状态', () => {
    const d = new Door(0, 0, 0);
    world.doors.push(d);
    d.active = false;
    expect(world.hasClosedDoor(0, 0)).toBe(true);
    d.active = true;
    expect(world.hasClosedDoor(0, 0)).toBe(false);
  });

  it('activeCharIdx 索引有效', () => {
    const w1 = new Warrior(1, 1);
    const w2 = new Warrior(2, 2);
    world.characters.push(w1, w2);
    expect(world.characters[world.activeCharIdx]).toBe(w1);
    world.activeCharIdx = 1;
    expect(world.characters[world.activeCharIdx]).toBe(w2);
  });
});