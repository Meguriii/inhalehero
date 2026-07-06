// ============================================================
// 实体系统 — Entity 基类及所有具体实体
// ============================================================

// ---- 实体 ID 常量（用于序列化/编辑器） ----
const ENTITY_IDS = {
  EMPTY: 0, WALL: 1, BOX: 2, TARGET: 3, WATER: 6,
  DOOR_PURPLE: 10, DOOR_YELLOW: 11,
  SWITCH_PURPLE: 20, SWITCH_YELLOW: 21,
  GOBLIN: 40, FIRE_DRAGON: 41,
  WARRIOR: 0, THIEF: 1, MAGE: 2, PRIEST: 3
};
// CHAR_TILE_BASE 在 constants.js 中定义

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
  isSolid()         { return true; }     // 不可走、不可推
  isControllable()  { return false; }
  isTargetTile()    { return false; }    // 是否是终点格
  isDoor()          { return false; }
  isSwitch()        { return false; }
  isMonster()       { return false; }

  // --- 事件钩子 ---
  render(ctx, x, y, ts) {}
  onStepOn(world, byEntity) {}         // 被走入时
  onPush(world, dr, dc, pusher) {}    // 被推动时
  onDestroy(world) {}                  // 被销毁时
  onDoorToggle(world, open) {}         // 门状态变化时
}

// ============================================================
//  Floor (空地) — 不存储在grid中，默认空位即为Floor
// ============================================================
class Floor extends Entity {
  constructor(r, c) { super(r, c); }
  isWalkable() { return true; }
  isSolid()    { return false; }
  render(ctx, x, y, ts) { drawFloor(ctx, x, y, ts); }
  toChar() { return '.'; }
}

// ============================================================
//  Wall (墙)
// ============================================================
class Wall extends Entity {
  constructor(r, c) { super(r, c); }
  isSolid() { return true; }
  render(ctx, x, y, ts) { drawWall(ctx, x, y, ts); }
  toChar() { return 'W'; }
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
      const speed = 1 + Math.random() * 4;
      const color = boxColors[Math.floor(Math.random() * boxColors.length)];
      world.spawnParticle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 2, color, 30, 50, 2 + Math.random() * 4);
    }
  }
  toChar() { return 'X'; }
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
  toChar() { return 'T'; }
}

// ============================================================
//  Water (水面)
// ============================================================
class Water extends Entity {
  constructor(r, c) { super(r, c); }
  isWalkable()  { return false; }
  isSolid()     { return true; }
  render(ctx, x, y, ts) { drawWater(ctx, x, y, ts); }
  toChar() { return '~'; }
}

// ============================================================
//  Door (能量门) — 存储在grid中，可被实体走入（打开时）
// ============================================================
class Door extends Entity {
  constructor(r, c, color) {
    super(r, c);
    this.color = color; // 0=紫, 1=黄
    this.active = false; // 由 World.updateDoorStates() 控制
  }
  isDoor()      { return true; }
  isWalkable()  { return this.active; }
  isSolid()     { return !this.active; } // 关闭时是实心的
  render(ctx, x, y, ts) {
    drawDoor(ctx, x, y, ts, this.color, this.active);
  }
  onDestroy(world) {
    // 门关闭时夹碎上面的东西
    const occupant = world.getEntity(this.r, this.c);
    if (occupant && occupant !== this) {
      if (occupant instanceof Box) {
        world.setEntity(this.r, this.c, this);
        occupant.onDestroy(world);
      } else if (occupant instanceof Character && occupant.controllable) {
        world.gameOver = true;
        document.getElementById('deathReason').textContent = '⚠ 能量门夹死了角色！';
        document.getElementById('deathOverlay').classList.add('show');
      }
    }
  }
  toChar() { return this.color === 0 ? 'P' : 'Y'; }
}

// ============================================================
//  MonsterGate (怪物门) — 品红色，场上所有怪物死亡后才开启
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
    // 门关闭时夹碎上面的东西
    const occupant = world.getEntity(this.r, this.c);
    if (occupant && occupant !== this) {
      if (occupant instanceof Box) {
        world.setEntity(this.r, this.c, this);
        occupant.onDestroy(world);
      } else if (occupant instanceof Character && occupant.controllable) {
        world.gameOver = true;
        document.getElementById('deathReason').textContent = '⚠ 怪物门夹死了角色！';
        document.getElementById('deathOverlay').classList.add('show');
      }
    }
  }
  toChar() { return 'M'; }
}

// ============================================================
//  Switch (开关) — 存储在grid中，可以被走上
// ============================================================
class Switch extends Entity {
  constructor(r, c, color) {
    super(r, c);
    this.color = color; // 0=紫, 1=黄
    this.pressed = false;
  }
  isSwitch()    { return true; }
  isWalkable()  { return true; }
  isSolid()     { return false; }
  render(ctx, x, y, ts) {
    drawSwitch(ctx, x, y, ts, this.color, this.pressed);
  }
  toChar() { return this.color === 0 ? 'p' : 'y'; }
}

// ============================================================
//  Monster 基类
// ============================================================
class Monster extends Entity {
  constructor(r, c) { super(r, c); }
  isMonster()   { return true; }
  canBePushed() { return true; }
  isWalkable()  { return false; }  // 不可直接走入（必须推）
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
    // 角色被推入哥布林 → 角色死亡
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
      const speed = 1 + Math.random() * 3;
      world.spawnParticle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 2,
        colors[Math.floor(Math.random() * colors.length)], 20, 35, 2 + Math.random() * 4);
    }
  }
  toChar() { return 'G'; }
}

// ============================================================
//  FireDragon (火龙) — 面朝4方向，喷火杀死前方单位，可被推动/杀死
// ============================================================
class FireDragon extends Monster {
  constructor(r, c, dir = 0) {
    super(r, c);
    this.dir = dir; // 0=上, 1=右, 2=下, 3=左
    this.breathing = false; // 是否正在喷火（供渲染/粒子使用）
  }
  // 将 dir (0-3) 映射为 facing 向量，供 world.js 使用
  get facing() {
    const dirs = [[-1,0],[0,1],[1,0],[0,-1]];
    return dirs[this.dir] || dirs[0];
  }
  render(ctx, x, y, ts) {
    drawDragon(ctx, x, y, ts, this.dir);
  }
  toChar() { return 'F'; }

  onStepOn(world, byEntity) {
    // 角色被推入火龙 → 角色死亡
    if (byEntity instanceof Character && byEntity.controllable) {
      world.killCharacter(byEntity, '🔥 被火龙烧死了！');
    }
    // 怪物被推入火龙 → 怪物死亡
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
      const speed = 1 + Math.random() * 4;
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
    this.type = type; // WARRIOR / THIEF / MAGE
    this.controllable = true;
  }
  isWalkable()  { return false; }
  isSolid()     { return false; }
  canBePushed() { return true; }  // 可被推动（战士推队友、盗贼拉队友等）
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
        colors[Math.floor(Math.random() * colors.length)], 25, 45, 2 + Math.random() * 5);
    }
  }
  executeMove(world, dr, dc) { return false; }
  toChar() { return String(this.type); }
}

// ============================================================
//  Warrior (战士) — 推链移动
// ============================================================
class Warrior extends Character {
  constructor(r, c) { super(r, c, WARRIOR); }
  executeMove(world, dr, dc) {
    const nr = this.r + dr, nc = this.c + dc;
    // 检查目标是否有可推实体
    const targetEntity = world.getEntity(nr, nc);
    if (targetEntity && targetEntity.canBePushed()) {
      const chain = world.collectPushChain(nr, nc, dr, dc);
      if (chain && world.executePushChain(chain, dr, dc, this)) {
        return true;
      }
      return false;
    }
    // 目标不可走入（如墙壁）→ 失败
    if (!world.isWalkable(nr, nc)) return false;
    // 空走
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
    // 检查目标格能否走进
    if (!world.isWalkable(nr, nc)) return false;
    const targetEntity = world.getEntity(nr, nc);
    if (targetEntity && targetEntity.isSolid()) return false;

    const br = this.r - dr, bc = this.c - dc;
    // 检查身后是否有实体可拉
    const behind = world.getEntity(br, bc);
    if (behind && behind !== this && behind.canBePushed()) {
      const steppedOn = world.getEntity(nr, nc);
      // 手动交换: 身后实体 → 原位, 自己 → 目标格
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
    // 空走
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
        // 水面不阻挡法师视线，继续扫描
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
      // 没有实体时，关闭的门阻挡视线
      if (world.hasClosedDoor(br, bc)) break;
      br += dr; bc += dc;
    }
    // 空走
    return world.moveEntityTo(this, this.r + dr, this.c + dc);
  }
}

// ============================================================
//  Priest (牧师) — 不能推箱子，自身和相邻角色受圣光保护免于怪物攻击
// ============================================================
class Priest extends Character {
  constructor(r, c) { super(r, c, PRIEST); }
  executeMove(world, dr, dc) {
    const nr = this.r + dr, nc = this.c + dc;
    // 目标有可推实体 → 牧师不能推，直接失败
    const targetEntity = world.getEntity(nr, nc);
    if (targetEntity && targetEntity.canBePushed()) return false;
    // 目标不可走入 → 失败
    if (!world.isWalkable(nr, nc)) return false;
    // 空走
    return world.moveEntityTo(this, nr, nc);
  }
}
