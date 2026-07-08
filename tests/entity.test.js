// ============================================================
// entity 模块测试
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import {
  Entity, Wall, Box, Target, Water,
  Door, Switch, MonsterGate,
  Character, Warrior, Thief, Mage, Priest,
  Monster, Goblin, FireDragon,
} from '../js/modules/entity.js';
import { World } from '../js/modules/world.js';
import { WARRIOR, THIEF, MAGE, PRIEST } from '../js/modules/constants.js';

describe('Entity 基类', () => {
  it('构造时设置 r, c', () => {
    const e = new Entity(3, 5);
    expect(e.r).toBe(3);
    expect(e.c).toBe(5);
  });

  it('自动递增 id', () => {
    Entity._nextId = 1;
    const e1 = new Entity(0, 0);
    const e2 = new Entity(0, 0);
    expect(e2.id).toBe(e1.id + 1);
  });

  it('默认碰撞属性', () => {
    const e = new Entity(0, 0);
    expect(e.canBePushed()).toBe(false);
    expect(e.isWalkable()).toBe(false);
    expect(e.isSolid()).toBe(true);
    expect(e.isControllable()).toBe(false);
  });
});

describe('Wall', () => {
  it('不可行走、不可推、不可控制', () => {
    const w = new Wall(0, 0);
    expect(w.isWalkable()).toBe(false);
    expect(w.canBePushed()).toBe(false);
    expect(w.isSolid()).toBe(true);
    expect(w.isControllable()).toBe(false);
  });
});

describe('Box', () => {
  it('可被推、不可行走', () => {
    const b = new Box(0, 0);
    expect(b.canBePushed()).toBe(true);
    expect(b.isWalkable()).toBe(false);
  });
});

describe('Target', () => {
  it('可行走、不占据', () => {
    const t = new Target(0, 0);
    expect(t.isWalkable()).toBe(true);
    expect(t.isSolid()).toBe(false);
  });
});

describe('Water', () => {
  it('不可行走', () => {
    const w = new Water(0, 0);
    expect(w.isWalkable()).toBe(false);
  });
});

describe('Door', () => {
  it('初始为锁定状态', () => {
    const d = new Door(0, 0, 0);
    expect(d.open).toBe(false);
    expect(d.isSolid()).toBe(true);
    expect(d.isWalkable()).toBe(false);
  });

  it('可互锁', () => {
    const d = new Door(0, 0, 0);
    expect(d.isInteractable()).toBe(true);
  });
});

describe('Switch', () => {
  it('构造时设置颜色', () => {
    const s = new Switch(0, 0, 1);
    expect(s.color).toBe(1);
  });
});

describe('MonsterGate', () => {
  it('初始为活跃状态', () => {
    const g = new MonsterGate(0, 0);
    expect(g.active).toBe(true);
  });
});

describe('Character（角色）', () => {
  it('Warrior 类型和属性', () => {
    const w = new Warrior(1, 2);
    expect(w.type).toBe(WARRIOR);
    expect(w.r).toBe(1);
    expect(w.c).toBe(2);
    expect(w.isControllable()).toBe(true);
    expect(w.canBePushed()).toBe(false);
  });

  it('Thief 类型', () => {
    const t = new Thief(1, 2);
    expect(t.type).toBe(THIEF);
  });

  it('Mage 类型', () => {
    const m = new Mage(1, 2);
    expect(m.type).toBe(MAGE);
  });

  it('Priest 类型', () => {
    const p = new Priest(1, 2);
    expect(p.type).toBe(PRIEST);
  });
});

describe('Monster（怪物）', () => {
  it('Goblin 初始属性', () => {
    const g = new Goblin(3, 4);
    expect(g.r).toBe(3);
    expect(g.c).toBe(4);
    expect(g.isControllable()).toBe(false);
  });

  it('FireDragon 有方向属性', () => {
    const d = new FireDragon(5, 5, 2);
    expect(d.dir).toBe(2);
  });
});