// ============================================================
// 实体系统 — ES Module 版本
// ============================================================
import {
  WARRIOR, THIEF, MAGE, PRIEST,
  C, SPRITES, SPRITES_SLEEP,
  GOBLIN_SPRITE, DRAGON_SPRITES,
} from './constants.js';
import {
  drawFloor, drawWall, drawBox, drawTarget, drawWater,
  drawDoor, drawSwitch, drawGoblin, drawDragon, drawChar,
  drawMonsterGate, drawHolyLight, drawSwitchOverlay,
} from './renderer.js';

// ============================================================
//  Entity 基类
// ============================================================
class Entity {
  constructor(r, c) {
    this.r = r;
    this.c = c;
    this.id = Entity._nextId++;
  }
  static _nextId = 1;

  // --- 碰撞/交互 查询 ---
  canBePushed()     { return false; }
  isWalkable()      { return false; }
  isSolid()         { return true; }
  isControllable()  { return false; }
  isTargetTile()    { return false; }
  isDoor()          { return false; }
  isSwitch()        { return false; }
  isMonster()       { return false; }

  // --- 事件钩子 ---
  render(ctx, x, y, ts) {}
  onStepOn(world, byEntity) {}
  onPush(world, dr, dc, pusher) {}
  onDestroy(world) {}
  onDoorToggle(world, open) {}
}

// ============================================================
//  Floor (空地) — 不存储在grid中，默认空位即为Floor
// ============================================================
class Floor extends Entity {
  constructor(r, c) { super(r, c); }
  isWalkable() { return true; }
  isSolid()    { return false; }
  render(ctx, x, y, ts) { drawFloor(ctx, x, y, ts); }
}

// ============================================================
//  Wall (墙)
// ============================================================
class Wall extends Entity {
  constructor(r, c) { super(r, c); }
  isSolid() { return true; }
  render(ctx, x, y, ts) { drawWall(ctx, x, y, ts); }
}

// ============================================================
//  Box (箱子) — 可移动
// ============================================================
class Box extends Entity {
  constructor(r, c) { super(r, c); }
  canBePushed() { return true; }
  isWalkable()  { return false; }
  isSolid()     { return false; }
  render(ctx, x, y, ts) {
    drawBox(ctx, x, y, ts);
  }
  onDestroy(world) {
    const ts = world.tileSize;
    const cx = this.c * ts + ts / 2, cy = this.r * ts + ts / 2;
    const boxColors = ['#8B5A2B', '#6B3A1B', '#A07040', '#4A2A10', '#D4A050'];
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1 + Math.random() * 4) * 2;
      const color = boxColors[Math.floor(Math.random() * boxColors.length)];
      world.spawnParticle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 2, color, 30, 50, 2 + Math.random() * 4);
    }
  }
}

// ============================================================
//  Target (终点) — 不存储在grid中，仅通过 targets[] 追踪
// ============================================================
class Target extends Entity {
  constructor(r, c) { super(r, c); }
  isWalkable()  { return true; }
  isSolid()     { return false; }
  isTargetTile() { return true; }
  render(ctx, x, y, ts) {
    drawTarget(ctx, x, y, ts);
  }
  onStepOn(world, by) { world.checkWin(); }
}

// ============================================================
//  Water (水面)
// ============================================================
class Water extends Entity {
  constructor(r, c) { super(r, c); }
  isWalkable()  { return false; }
  isSolid()     { return true; }
  render(ctx, x, y, ts) { drawWater(ctx, x, y, ts); }
}

// ============================================================
//  Door (能量门) — 存储在grid中，可被实体走入（打开时）
// ============================================================
class Door extends Entity {
  constructor(r, c, color) {
    super(r, c);
    this.color = color;
    this.active = false;
  }
  isDoor()      { return true; }
  isWalkable()  { return this.active; }
  isSolid()     { return !this.active; }
  render(ctx, x, y, ts) {
    drawDoor(ctx, x, y, ts, this.color, this.active);
  }
  onDestroy(world) {
    const ts = world.tileSize;
    const cx = this.c * ts + ts / 2, cy = this.r * ts + ts / 2;
    const colors = ['#9B59B6', '#AF7AC5', '#F1C40F', '#F9E79F'];
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 2) * 2;
      world.spawnParticle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 1,
        colors[Math.floor(Math.random() * colors.length)], 10, 20, 2 + Math.random() * 3);
    }
  }
}

// ============================================================
//  MonsterGate (怪物门)
// ============================================================
class MonsterGate extends Entity {
  constructor(r, c) {
    super(r, c);
    this.open = false;
  }
  isDoor()      { return true; }
  isOpen()      { return this.open; }
  isWalkable()  { return this.open; }
  isSolid()     { return !this.open; }
  render(ctx, x, y, ts) {
    drawMonsterGate(ctx, x, y, ts, this.open);
  }
  canBePushed() { return false; }
  onDestroy(world) {
    const ts = world.tileSize;
    const cx = this.c * ts + ts / 2, cy = this.r * ts + ts / 2;
    const colors = ['#E91E63', '#F06292', '#FF4081', '#C2185B'];
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 2) * 2;
      world.spawnParticle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 1,
        colors[Math.floor(Math.random() * colors.length)], 10, 20, 2 + Math.random() * 3);
    }
  }
}

// ============================================================
//  Switch (开关)
// ============================================================
class Switch extends Entity {
  constructor(r, c, color) {
    super(r, c);
    this.color = color;
    this.pressed = false;
  }
  isSwitch()    { return true; }
  isWalkable()  { return true; }
  isSolid()     { return false; }
  render(ctx, x, y, ts) {
    drawSwitch(ctx, x, y, ts, this.color, this.pressed);
  }
}

// ============================================================
//  Monster 基类
// ============================================================
class Monster extends Entity {
  constructor(r, c) { super(r, c); }
  isMonster()   { return true; }
  canBePushed() { return true; }
  isWalkable()  { return false; }
  isSolid()     { return false; }
}

// ============================================================
//  Goblin (哥布林)
// ============================================================
class Goblin extends Monster {
  constructor(r, c) { super(r, c); }
  render(ctx, x, y, ts) {
    drawFloor(ctx, x, y, ts);
    drawGoblin(ctx, x, y, ts);
  }
  onStepOn(world, byEntity) {
    if (byEntity instanceof Character && byEntity.controllable) {
      world.killCharacter(byEntity, '⚠ 被哥布林攻击了！');
    }
  }
  onDestroy(world) {
    const ts = world.tileSize;
    const cx = this.c * ts + ts / 2, cy = this.r * ts + ts / 2;
    const colors = ['#2d8a4e', '#1a5c33', '#3ba35e', '#ff3333', '#ff6666'];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1 + Math.random() * 3) * 2;
      world.spawnParticle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 2,
        colors[Math.floor(Math.random() * colors.length)], 20, 35, 2 + Math.random() * 4);
    }
  }
}

// ============================================================
//  FireDragon (火龙)
// ============================================================
class FireDragon extends Monster {
  constructor(r, c, dir = 0) {
    super(r, c);
    this.dir = dir;
    this.breathing = false;
  }
  get facing() {
    const dirs = [[-1,0],[0,1],[1,0],[0,-1]];
    return dirs[this.dir] || dirs[0];
  }
  render(ctx, x, y, ts) {
    drawDragon(ctx, x, y, ts, this.dir);
  }
  onStepOn(world, byEntity) {
    if (byEntity instanceof Character && byEntity.controllable) {
      world.killCharacter(byEntity, '🔥 被火龙烧死了！');
    }
    if (byEntity instanceof Monster && byEntity !== this) {
      world.destroyEntity(byEntity);
    }
  }
  onDestroy(world) {
    const ts = world.tileSize;
    const cx = this.c * ts + ts / 2, cy = this.r * ts + ts / 2;
    const colors = ['#FF4500', '#FF6347', '#FFD700', '#FF8C00', '#FF0000', '#8B0000'];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1 + Math.random() * 4) * 2;
      world.spawnParticle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 2,
        colors[Math.floor(Math.random() * colors.length)], 30, 50, 2 + Math.random() * 5);
    }
  }
}

// ============================================================
//  Character 基类
// ============================================================
class Character extends Entity {
  constructor(r, c, type) {
    super(r, c);
    this.type = type;
    this.controllable = true;
  }
  isWalkable()  { return false; }
  isSolid()     { return false; }
  canBePushed() { return true; }
  render(ctx, x, y, ts, sleep) {
    drawChar(ctx, x, y, ts, this.type, sleep);
  }
  onDeathParticles(world) {
    const ts = world.tileSize;
    const cx = this.c * ts + ts / 2, cy = this.r * ts + ts / 2;
    const colors = this.type === WARRIOR ? ['#E74C3C', '#C0392B', '#ff6666', '#ff3333'] :
                   this.type === THIEF ? ['#2ECC71', '#27AE60', '#66ff99', '#33ff77'] :
                                         ['#3498DB', '#2980B9', '#66b5ff', '#3399ff'];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      world.spawnParticle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 3,
        colors[Math.floor(Math.random() * colors.length)], 25, 45, (2 + Math.random() * 5) * 2);
    }
  }
  executeMove(world, dr, dc) { return false; }
}

// ============================================================
//  Warrior (战士) — 推链移动
// ============================================================
class Warrior extends Character {
  constructor(r, c) { super(r, c, WARRIOR); }
  executeMove(world, dr, dc) {
    const nr = this.r + dr, nc = this.c + dc;
    const targetEntity = world.getEntity(nr, nc);
    if (targetEntity && targetEntity.canBePushed()) {
      const chain = world.collectPushChain(nr, nc, dr, dc);
      if (chain && world.executePushChain(chain, dr, dc, this)) {
        return true;
      }
      return false;
    }
    if (!world.isWalkable(nr, nc)) return false;
    return world.moveEntityTo(this, nr, nc);
  }
}

// ============================================================
//  Thief (盗贼) — 可以拉身后实体
// ============================================================
class Thief extends Character {
  constructor(r, c) { super(r, c, THIEF); }
  executeMove(world, dr, dc) {
    const nr = this.r + dr, nc = this.c + dc;
    if (!world.isWalkable(nr, nc)) return false;
    const targetEntity = world.getEntity(nr, nc);
    if (targetEntity && targetEntity.isSolid()) return false;

    const br = this.r - dr, bc = this.c - dc;
    const behind = world.getEntity(br, bc);
    if (behind && behind !== this && behind.canBePushed()) {
      const steppedOn = world.getEntity(nr, nc);
      world.grid[br][bc] = null;
      world.grid[this.r][this.c] = behind;
      behind.r = this.r; behind.c = this.c;
      world.grid[nr][nc] = this;
      this.r = nr; this.c = nc;
      if (steppedOn && steppedOn !== this && steppedOn !== behind) {
        steppedOn.onStepOn(world, this);
      }
      return true;
    }
    return world.moveEntityTo(this, nr, nc);
  }
}

// ============================================================
//  Mage (法师) — 线上交换
// ============================================================
class Mage extends Character {
  constructor(r, c) { super(r, c, MAGE); }
  executeMove(world, dr, dc) {
    let br = this.r + dr, bc = this.c + dc;
    while (br >= 0 && br < world.rows && bc >= 0 && bc < world.cols) {
      const entity = world.getEntity(br, bc);
      if (entity && entity !== this) {
        if (entity instanceof Wall) break;
        if (entity instanceof Water) {
          br += dr; bc += dc;
          continue;
        }
        if (entity instanceof Character || entity instanceof Monster || entity instanceof Box) {
          const oldR = this.r, oldC = this.c;
          world.setEntity(oldR, oldC, entity);
          world.setEntity(br, bc, this);
          entity.r = oldR; entity.c = oldC;
          this.r = br; this.c = bc;
          world.spawnMageParticles(oldR, oldC, br, bc);
          return true;
        }
        break;
      }
      if (world.hasClosedDoor(br, bc)) break;
      br += dr; bc += dc;
    }
    return world.moveEntityTo(this, this.r + dr, this.c + dc);
  }
}

// ============================================================
//  Priest (牧师) — 不能推箱子，圣光保护
// ============================================================
class Priest extends Character {
  constructor(r, c) { super(r, c, PRIEST); }
  executeMove(world, dr, dc) {
    const nr = this.r + dr, nc = this.c + dc;
    const targetEntity = world.getEntity(nr, nc);
    if (targetEntity && targetEntity.canBePushed()) return false;
    if (!world.isWalkable(nr, nc)) return false;
    return world.moveEntityTo(this, nr, nc);
  }
}

export {
  Entity, Floor, Wall, Box, Target, Water,
  Door, MonsterGate, Switch,
  Monster, Goblin, FireDragon,
  Character, Warrior, Thief, Mage, Priest,
};