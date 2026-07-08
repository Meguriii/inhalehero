// ============================================================
// 测试回溯时地面单位丢失的bug
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../js/modules/world.js';
import {
  Wall, Box, Target, Water, Door, MonsterGate, Switch,
  Goblin, FireDragon, Warrior, Thief, Mage, Priest,
} from '../js/modules/entity.js';
import { exportMapFromWorld, parseMapToWorld } from '../js/modules/levelLoader.js';

// ---- 辅助函数 ----

function createEmptyWorld(rows, cols) {
  const w = new World(rows, cols);
  for (let r = 0; r < rows; r++) {
    w.grid[r] = [];
    for (let c = 0; c < cols; c++) {
      w.grid[r][c] = null;
    }
  }
  return w;
}

/**
 * 模拟 undo() 函数的完整流程
 */
function simulateUndo(snapshot, oldWorld) {
  const w = parseMapToWorld(snapshot.map, snapshot.overlays || []);
  w.activeCharIdx = snapshot.activeCharIdx;
  w.moveCount = snapshot.moveCount;
  w.gameOver = false;
  w.won = false;

  if (oldWorld) {
    w.setDeathCallback(oldWorld.onDeath);
    w.setWinCallback(oldWorld.onWin);
  }

  w.updateDoorStates();
  w.updateMonsterGates();
  return w;
}

function saveSnapshot(world) {
  const { map, overlays } = exportMapFromWorld(world);
  return {
    map,
    overlays,
    activeCharIdx: world.activeCharIdx,
    moveCount: world.moveCount,
  };
}

describe('Undo bug - entity on ground tile', () => {
  // 基础场景

  it('roundtrip: warrior on Target', () => {
    const w = createEmptyWorld(3, 3);
    w.targets.push(new Target(1, 1));
    const warrior = new Warrior(1, 1);
    w.characters.push(warrior);
    w.grid[1][1] = warrior;

    const { map, overlays } = exportMapFromWorld(w);
    expect(map[1][1]).toBe('T');
    expect(overlays).toContainEqual(expect.objectContaining({ char: '0', r: 1, c: 1 }));

    const w2 = parseMapToWorld(map, overlays);
    expect(w2.targets.some(t => t.r === 1 && t.c === 1)).toBe(true);
    expect(w2.grid[1][1] instanceof Warrior).toBe(true);
  });

  // ---- 复杂的集成测试 ----
  // 模拟真实游戏场景：多个实体在不同地面单位上，移动，然后undo

  it('complex scenario: full game flow and undo', () => {
    const w = createEmptyWorld(5, 5);
    
    // 设置地面单位
    w.targets.push(new Target(0, 0));
    w.switches.push(new Switch(0, 1, 0)); // 颜色0的开关
    w.doors.push(new Door(2, 2, 0));       // 颜色0的门
    w.targets.push(new Target(3, 3));

    // 实体
    // Warrior站在Target(0,0)上
    const warrior = new Warrior(0, 0);
    w.characters.push(warrior);
    w.grid[0][0] = warrior;
    
    // Box站在Switch(0,1)上，应该压住开关
    const box = new Box(0, 1);
    w.grid[0][1] = box;
    
    // Goblin站在Target(3,3)上
    const goblin = new Goblin(3, 3);
    w.monsters.push(goblin);
    w.grid[3][3] = goblin;
    
    // Thief站在打开的Door(2,2)上
    const thief = new Thief(2, 2);
    w.characters.push(thief);
    w.grid[2][2] = thief;

    // 更新门状态（箱在开关上，门打开）
    w.updateDoorStates();

    // 验证初始状态
    expect(w.doors[0].active).toBe(true);
    expect(w.grid[0][0] instanceof Warrior).toBe(true);
    expect(w.grid[0][1] instanceof Box).toBe(true);
    expect(w.grid[2][2] instanceof Thief).toBe(true);
    expect(w.grid[3][3] instanceof Goblin).toBe(true);

    // 保存快照
    const snap = saveSnapshot(w);

    // 模拟移动：所有实体离开地面单位
    // Warrior离开Target(0,0) → (1,0)
    w.grid[0][0] = null;
    warrior.r = 1; warrior.c = 0;
    w.grid[1][0] = warrior;
    
    // Box离开Switch(0,1) → (0,2)
    w.grid[0][1] = null;
    box.r = 0; box.c = 2;
    w.grid[0][2] = box;
    w.updateDoorStates(); // 门关闭
    
    // Thief离开Door(2,2) → (2,3)
    w.grid[2][2] = null;
    thief.r = 2; thief.c = 3;
    w.grid[2][3] = thief;
    
    // Goblin离开Target(3,3) → (3,4)
    w.grid[3][3] = null;
    goblin.r = 3; goblin.c = 4;
    w.grid[3][4] = goblin;

    // 执行undo
    const w2 = simulateUndo(snap, w);
    w2.updateDoorStates();
    w2.updateMonsterGates();

    // 验证所有Target存在
    expect(w2.targets.length).toBe(2);
    expect(w2.targets.some(t => t.r === 0 && t.c === 0)).toBe(true);
    expect(w2.targets.some(t => t.r === 3 && t.c === 3)).toBe(true);
    
    // 验证Switch存在
    expect(w2.switches.length).toBe(1);
    expect(w2.switches.some(s => s.r === 0 && s.c === 1)).toBe(true);
    
    // 验证Door存在
    expect(w2.doors.length).toBe(1);
    expect(w2.doors.some(d => d.r === 2 && d.c === 2)).toBe(true);
    
    // 验证实体的位置
    expect(w2.characters.some(ch => ch.r === 0 && ch.c === 0 && ch instanceof Warrior)).toBe(true);
    expect(w2.characters.some(ch => ch.r === 2 && ch.c === 2 && ch instanceof Thief)).toBe(true);
    expect(w2.monsters.some(m => m.r === 3 && m.c === 3 && m instanceof Goblin)).toBe(true);
    expect(w2.grid[0][1] instanceof Box).toBe(true);
    
    // 验证grid完整性
    expect(w2.grid[0][0] instanceof Warrior).toBe(true);
    expect(w2.grid[2][2] instanceof Thief).toBe(true);
    expect(w2.grid[3][3] instanceof Goblin).toBe(true);
    expect(w2.grid[0][1] instanceof Box).toBe(true);
    expect(w2.grid[1][0]).toBeNull();
    expect(w2.grid[2][3]).toBeNull();
    expect(w2.grid[3][4]).toBeNull();
    
    // Door应该是打开的（箱在开关上）
    expect(w2.doors[0].active).toBe(true);
    
    // Switch被压住
    expect(w2.switches[0].pressed).toBe(true);
  });

  // ---- 模拟游戏中的多步移动和回溯链 ----
  
  it('multi-step undo with entities on ground tiles', () => {
    const w = createEmptyWorld(4, 4);
    w.targets.push(new Target(1, 1));
    w.switches.push(new Switch(2, 2, 0));
    
    // 初始：Warrior在(0,0)，Goblin在Switch(2,2)上
    const warrior = new Warrior(0, 0);
    w.characters.push(warrior);
    w.grid[0][0] = warrior;
    
    const goblin = new Goblin(2, 2);
    w.monsters.push(goblin);
    w.grid[2][2] = goblin;

    // 快照1：初始状态
    const snap1 = saveSnapshot(w);

    // 移动Warrior到Target(1,1)
    w.grid[0][0] = null;
    warrior.r = 1; warrior.c = 1;
    w.grid[1][1] = warrior;

    // 快照2：Warrior在Target上，Goblin在Switch上
    const snap2 = saveSnapshot(w);

    // 移动Warrior离开Target到(0,1)
    w.grid[1][1] = null;
    warrior.r = 0; warrior.c = 1;
    w.grid[0][1] = warrior;
    
    // 移动Goblin离开Switch到(2,3)
    w.grid[2][2] = null;
    goblin.r = 2; goblin.c = 3;
    w.grid[2][3] = goblin;

    // 回溯到snap2（Warrior在Target上，Goblin在Switch上）
    const w2 = simulateUndo(snap2, w);
    
    expect(w2.targets.some(t => t.r === 1 && t.c === 1)).toBe(true);
    expect(w2.switches.some(s => s.r === 2 && s.c === 2)).toBe(true);
    expect(w2.grid[1][1] instanceof Warrior).toBe(true);
    expect(w2.grid[2][2] instanceof Goblin).toBe(true);
    expect(w2.switches[0].pressed).toBe(true);

    // 回溯到snap1（Warrior在(0,0)，Goblin在Switch上）
    const w3 = simulateUndo(snap1, w);
    
    expect(w3.targets.some(t => t.r === 1 && t.c === 1)).toBe(true);
    expect(w3.switches.some(s => s.r === 2 && s.c === 2)).toBe(true);
    expect(w3.grid[0][0] instanceof Warrior).toBe(true);
    expect(w3.grid[2][2] instanceof Goblin).toBe(true);
    expect(w3.grid[1][1]).toBeNull();
    expect(w3.switches[0].pressed).toBe(true);
  });

  // ---- 测试目标：Firedragon 站在地面单位上 ----
  
  it('firedragon on Target -> undo', () => {
    const w = createEmptyWorld(3, 3);
    w.targets.push(new Target(1, 1));
    const dragon = new FireDragon(1, 1, 0);
    w.monsters.push(dragon);
    w.grid[1][1] = dragon;

    const snap = saveSnapshot(w);
    
    // 移动龙
    w.grid[1][1] = null;
    dragon.r = 0; dragon.c = 0;
    w.grid[0][0] = dragon;

    const w2 = simulateUndo(snap, w);
    
    expect(w2.targets.some(t => t.r === 1 && t.c === 1)).toBe(true);
    expect(w2.grid[1][1] instanceof FireDragon).toBe(true);
  });

  // ---- 测试怪物的 onDestroy 是否会影响回溯 ----
  
  it('entity destroyed then undo should restore ground tile', () => {
    const w = createEmptyWorld(3, 3);
    w.targets.push(new Target(0, 0));
    w.targets.push(new Target(2, 2));
    
    const goblin = new Goblin(0, 0);
    w.monsters.push(goblin);
    w.grid[0][0] = goblin;
    
    const warrior = new Warrior(2, 2);
    w.characters.push(warrior);
    w.grid[2][2] = warrior;

    // 快照：Goblin在Target(0,0)上，Warrior在Target(2,2)上
    const snap = saveSnapshot(w);

    // 杀死哥布林
    w.destroyEntity(goblin);
    
    // 移动战士离开
    w.grid[2][2] = null;
    warrior.r = 1; warrior.c = 1;
    w.grid[1][1] = warrior;

    // 回溯
    const w2 = simulateUndo(snap, w);

    // 两个Target都存在
    expect(w2.targets.length).toBe(2);
    expect(w2.targets.some(t => t.r === 0 && t.c === 0)).toBe(true);
    expect(w2.targets.some(t => t.r === 2 && t.c === 2)).toBe(true);
    
    // Goblin 在 Target(0,0) 上
    expect(w2.monsters.some(m => m.r === 0 && m.c === 0 && m instanceof Goblin)).toBe(true);
    expect(w2.grid[0][0] instanceof Goblin).toBe(true);
    
    // Warrior 在 Target(2,2) 上
    expect(w2.characters.some(ch => ch.r === 2 && ch.c === 2 && ch instanceof Warrior)).toBe(true);
    expect(w2.grid[2][2] instanceof Warrior).toBe(true);
  });

  // ---- 测试：3个角色在不同Target上 ----
  
  it('three warriors on three targets -> undo', () => {
    const w = createEmptyWorld(5, 5);
    w.targets.push(new Target(0, 0));
    w.targets.push(new Target(1, 1));
    w.targets.push(new Target(2, 2));
    
    const w1 = new Warrior(0, 0);
    w.characters.push(w1);
    w.grid[0][0] = w1;
    const w2 = new Warrior(1, 1);
    w.characters.push(w2);
    w.grid[1][1] = w2;
    const w3 = new Warrior(2, 2);
    w.characters.push(w3);
    w.grid[2][2] = w3;

    const snap = saveSnapshot(w);
    
    // 全部移走
    w.grid[0][0] = null; w1.r = 0; w1.c = 4; w.grid[0][4] = w1;
    w.grid[1][1] = null; w2.r = 1; w2.c = 4; w.grid[1][4] = w2;
    w.grid[2][2] = null; w3.r = 2; w3.c = 4; w.grid[2][4] = w3;

    const w2_w = simulateUndo(snap, w);

    expect(w2_w.targets.length).toBe(3);
    expect(w2_w.grid[0][0] instanceof Warrior).toBe(true);
    expect(w2_w.grid[1][1] instanceof Warrior).toBe(true);
    expect(w2_w.grid[2][2] instanceof Warrior).toBe(true);
    expect(w2_w.grid[0][4]).toBeNull();
  });

  // ---- 极端测试：所有地面类型 + 实体混合 ----
  
  it('mixed ground types with entities -> undo', () => {
    const w = createEmptyWorld(5, 5);
    
    // 所有4种地面单位类型
    w.targets.push(new Target(0, 0));
    w.switches.push(new Switch(0, 1, 0));
    w.doors.push(new Door(0, 2, 0));
    w.monsterGates.push(new MonsterGate(0, 3));
    
    // 实体站在它们上面
    const warrior = new Warrior(0, 0);
    w.characters.push(warrior);
    w.grid[0][0] = warrior;
    
    const box = new Box(0, 1);
    w.grid[0][1] = box;
    
    const thief = new Thief(0, 2);
    w.characters.push(thief);
    w.grid[0][2] = thief;
    
    // 怪物门需要怪物活着才关闭，直接设gate.open = true让它可通行
    const gate = w.monsterGates[0];
    gate.open = true; // 手动打开
    const goblin = new Goblin(0, 3);
    w.monsters.push(goblin);
    w.grid[0][3] = goblin;
    
    w.updateDoorStates(); // Door会被打开（Box在Switch上）

    const snap = saveSnapshot(w);
    
    // 验证door是打开的
    expect(w.doors[0].active).toBe(true);
    // 门上有角色
    expect(w.grid[0][2] instanceof Thief).toBe(true);
    
    // 移动所有实体离开
    w.grid[0][0] = null; warrior.r = 4; warrior.c = 0; w.grid[4][0] = warrior;
    w.grid[0][1] = null; box.r = 4; box.c = 1; w.grid[4][1] = box;
    w.grid[0][2] = null; thief.r = 4; thief.c = 2; w.grid[4][2] = thief;
    w.grid[0][3] = null; goblin.r = 4; goblin.c = 3; w.grid[4][3] = goblin;

    const w2 = simulateUndo(snap, w);

    // 验证所有地面单位存在
    expect(w2.targets.length).toBe(1);
    expect(w2.switches.length).toBe(1);
    expect(w2.doors.length).toBe(1);
    expect(w2.monsterGates.length).toBe(1);
    
    // 验证所有实体回到原位
    expect(w2.grid[0][0] instanceof Warrior).toBe(true);
    expect(w2.grid[0][1] instanceof Box).toBe(true);
    expect(w2.grid[0][2] instanceof Thief).toBe(true);
    expect(w2.grid[0][3] instanceof Goblin).toBe(true);
    
    // Door打开（Box在Switch上）
    expect(w2.doors[0].active).toBe(true);
  });

  // ---- 检查：updateDoorStates 在回溯时是否错误地销毁了实体 ----
  
  it('check updateDoorStates does not destroy entities on undo', () => {
    // 场景：Switch控制Door，Door上有实体
    const w = createEmptyWorld(3, 3);
    w.switches.push(new Switch(0, 0, 0));
    w.doors.push(new Door(0, 1, 0));
    
    // Box在Switch上（door打开）
    const box = new Box(0, 0);
    w.grid[0][0] = box;
    w.updateDoorStates(); // door.active = true
    
    // Warrior站在开门上
    const warrior = new Warrior(0, 1);
    w.characters.push(warrior);
    w.grid[0][1] = warrior;

    // 保存快照1：门打开，Warrior在门上，Box在Switch上
    const snap1 = saveSnapshot(w);

    // 移动Box离开Switch（门会关闭）
    w.grid[0][0] = null;
    box.r = 1; box.c = 0;
    w.grid[1][0] = box;
    
    // 同时也移动Warrior离开门（避免在门关闭时被夹死）
    w.grid[0][1] = null;
    warrior.r = 1; warrior.c = 1;
    w.grid[1][1] = warrior;
    
    w.updateDoorStates(); // door.active = false
    
    // 回溯到snap1（门应该打开，实体应该回到原位）
    const w2 = simulateUndo(snap1, w);
    
    // 实体都在
    expect(w2.grid[0][0] instanceof Box).toBe(true);
    expect(w2.grid[0][1] instanceof Warrior).toBe(true);
    
    // 门打开
    expect(w2.doors[0].active).toBe(true);
    
    // 所有数组完整
    expect(w2.characters.length).toBe(1);
    expect(w2.switches.length).toBe(1);
    expect(w2.doors.length).toBe(1);
  });
});