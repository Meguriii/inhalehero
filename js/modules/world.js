// ============================================================
// World — 游戏世界核心（ES Module 版本）
// ============================================================
import {
  Wall, Box, Target, Water,
  Door, MonsterGate, Switch,
  Monster, Goblin, FireDragon,
  Character, Warrior, Thief, Mage, Priest,
} from './entity.js';
import { C, PRIEST } from './constants.js';
import {
  drawFloor, drawHolyLight, drawSwitchOverlay,
} from './renderer.js';


// ============================================================
//  World 类
// ============================================================
class World {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.grid = [];
    this.characters = [];
    this.targets = [];
    this.switches = [];
    this.doors = [];
    this.monsterGates = [];
    this.monsters = [];
    this.activeCharIdx = 0;
    this.particles = [];
    this.won = false;
    this.gameOver = false;
    this.moveCount = 0;
    this.tileSize = 48;
  }

  // ---- 实体管理 ----
  getEntity(r, c) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
    return this.grid[r][c] || null;
  }

  setEntity(r, c, entity) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;
    this.grid[r][c] = entity;
    if (entity) { entity.r = r; entity.c = c; }
  }

  isEmptyTile(r, c) {
    return !this.getEntity(r, c);
  }

  hasDoorAt(r, c) {
    return this.doors.some(d => d.r === r && d.c === c) ||
           this.monsterGates.some(g => g.r === r && g.c === c);
  }

  hasClosedDoor(r, c) {
    return this.doors.some(d => d.r === r && d.c === c && !d.active) ||
           this.monsterGates.some(g => g.r === r && g.c === c && !g.open);
  }

  hasOpenDoor(r, c) {
    return this.doors.some(d => d.r === r && d.c === c && d.active) ||
           this.monsterGates.some(g => g.r === r && g.c === c && g.open);
  }

  isWalkable(r, c) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
    if (this.hasClosedDoor(r, c)) return false;
    const e = this.getEntity(r, c);
    if (!e) return true;
    return e.isWalkable();
  }

  isSolid(r, c) {
    if (this.hasClosedDoor(r, c)) return true;
    const e = this.getEntity(r, c);
    if (!e) return false;
    return e.isSolid();
  }

  // ---- 目标/开关/门查询 ----
  getTargetAt(r, c) {
    return this.targets.find(t => t.r === r && t.c === c) || null;
  }

  getSwitchAt(r, c) {
    return this.switches.find(s => s.r === r && s.c === c) || null;
  }

  getDoorAt(r, c) {
    return this.doors.find(d => d.r === r && d.c === c) ||
           this.monsterGates.find(g => g.r === r && g.c === c) || null;
  }

  // ---- 粒子系统 ----
  spawnParticle(x, y, vx, vy, color, life, maxLife, size) {
    this.particles.push({ x, y, vx, vy, color, life, maxLife, size });
  }

  spawnMageParticles(r1, c1, r2, c2) {
    const ts = this.tileSize;
    const x1 = c1 * ts + ts / 2, y1 = r1 * ts + ts / 2, x2 = c2 * ts + ts / 2, y2 = r2 * ts + ts / 2;
    const mageColor = '#3498DB', mageColor2 = '#85C1E9', starColors = ['#FFD700', '#FFEE88', '#ffffff'];
    for (let i = 0; i < 16; i++) {
      const t = Math.random();
      const bx = x1 + (x2 - x1) * t, by = y1 + (y2 - y1) * t;
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 1.5) * 2;
      this.spawnParticle(bx + Math.random() * 4 - 2, by + Math.random() * 4 - 2,
        Math.cos(angle) * speed, Math.sin(angle) * speed - 0.5,
        Math.random() < 0.5 ? mageColor : mageColor2, 15, 25, 2 + Math.random() * 3);
    }
    for (let p of [[x1, y1], [x2, y2]]) {
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.5 + Math.random() * 2) * 2;
        this.spawnParticle(p[0], p[1], Math.cos(angle) * speed, Math.sin(angle) * speed - 1,
          starColors[Math.floor(Math.random() * starColors.length)], 12, 27, 1.5 + Math.random() * 3);
      }
    }
  }

  // ---- 移动 ----
  moveEntityTo(entity, nr, nc) {
    if (!entity) return false;
    if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) return false;
    if (!this.isWalkable(nr, nc)) return false;
    const target = this.getEntity(nr, nc);
    if (target && target.isSolid()) return false;
    const or = entity.r, oc = entity.c;
    this.grid[or][oc] = null;
    entity.r = nr; entity.c = nc;
    this.grid[nr][nc] = entity;
    if (target) {
      target.onStepOn(this, entity);
    }
    return true;
  }

  syncState() {
    this.updateMonsters();
    this.updateDoorStates();
    this.updateMonsterGates();
    this.checkWin();
  }

  // ---- 推链 ----
  collectPushChain(startR, startC, dr, dc) {
    const chain = [];
    let r = startR, c = startC;
    while (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      const entity = this.getEntity(r, c);
      if (!entity) break;
      if (entity instanceof Wall || this.hasClosedDoor(r, c)) return null;
      if (!entity.canBePushed()) return null;
      chain.push(entity);
      r += dr; c += dc;
    }
    if (!this.isWalkable(r, c) || this.hasClosedDoor(r, c)) return null;
    return chain;
  }

  executePushChain(chain, dr, dc, pusher) {
    const pr = pusher.r, pc = pusher.c;
    this.grid[pr][pc] = null;
    for (let i = chain.length - 1; i >= 0; i--) {
      const entity = chain[i];
      const nr = entity.r + dr, nc = entity.c + dc;
      if (this.hasClosedDoor(nr, nc) || this.getEntity(nr, nc) instanceof Wall) {
        this.grid[entity.r][entity.c] = null;
        entity.onDestroy(this);
        continue;
      }
      const target = this.getEntity(nr, nc);
      if (target && target !== pusher && target.isSolid()) {
        return false;
      }
      this.grid[entity.r][entity.c] = null;
      this.grid[nr][nc] = entity;
      entity.r = nr; entity.c = nc;
    }
    const fr = pr + dr, fc = pc + dc;
    this.grid[fr][fc] = pusher;
    pusher.r = fr; pusher.c = fc;
    return true;
  }

  // ---- 门状态更新 ----
  updateDoorStates() {
    const swTotal = { 0: 0, 1: 0 };
    const swPressed = { 0: 0, 1: 0 };
    for (let sw of this.switches) {
      swTotal[sw.color] = (swTotal[sw.color] || 0) + 1;
      sw.pressed = false;
      const entity = this.getEntity(sw.r, sw.c);
      if (entity && entity !== sw) {
        if (entity instanceof Character || entity instanceof Box || entity instanceof Monster) {
          sw.pressed = true;
          swPressed[sw.color] = (swPressed[sw.color] || 0) + 1;
        }
      }
    }
    const allPressed = { 0: false, 1: false };
    for (let c of [0, 1]) {
      if (swTotal[c] > 0 && swPressed[c] === swTotal[c]) {
        allPressed[c] = true;
      }
    }
    for (let door of this.doors) {
      const wasActive = door.active;
      const nowActive = allPressed[door.color] || false;
      door.active = nowActive;
      if (wasActive && !nowActive && !this.gameOver) {
        const occupant = this.getEntity(door.r, door.c);
        if (occupant) {
          if (occupant instanceof Character && occupant.controllable) {
            this.setEntity(door.r, door.c, null);
            this.killCharacter(occupant, '⚠ 能量门夹死了角色！');
          } else {
            this.destroyEntity(occupant);
          }
        }
      }
    }
  }

  // ---- 怪物门状态更新 ----
  updateMonsterGates() {
    const monstersAlive = this.monsters.length > 0;
    const shouldOpen = !monstersAlive;
    for (let gate of this.monsterGates) {
      const wasOpen = gate.open;
      gate.open = shouldOpen;
      if (wasOpen && !shouldOpen && !this.gameOver) {
        const occupant = this.getEntity(gate.r, gate.c);
        if (occupant) {
          this.setEntity(gate.r, gate.c, null);
          if (occupant instanceof Character && occupant.controllable) {
            this.killCharacter(occupant, '⚠ 怪物门夹死了角色！');
          } else {
            this.destroyEntity(occupant);
          }
        }
      }
    }
  }

  // ---- 怪物逻辑 ----
  scanFireTarget(dragon) {
    const dr = dragon.facing[0], dc = dragon.facing[1];
    let r = dragon.r + dr, c = dragon.c + dc;
    while (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      const e = this.getEntity(r, c);
      if (e instanceof Wall || e instanceof Box || this.hasClosedDoor(r, c)) break;
      if (e instanceof Character) return e;
      if (e instanceof Monster && e !== dragon) return e;
      r += dr; c += dc;
    }
    return null;
  }

  renderDragonFire(dragon, targetR, targetC) {
    const ts = this.tileSize;
    const dr = dragon.facing[0], dc = dragon.facing[1];
    let r = dragon.r + dr, c = dragon.c + dc;
    while (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      const angle = Math.atan2(dr, dc);
      for (let i = 0; i < 6; i++) {
        const px = c * ts + ts / 2 + (Math.random() - 0.5) * ts * 0.8;
        const py = r * ts + ts / 2 + (Math.random() - 0.5) * ts * 0.8;
        this.spawnParticle(px, py,
          Math.cos(angle + (Math.random() - 0.5) * 0.8) * (1 + Math.random() * 2),
          Math.sin(angle + (Math.random() - 0.5) * 0.8) * (1 + Math.random() * 2),
          Math.random() < 0.5 ? '#FF4500' : '#FFA500', 20 + Math.random() * 15, 35,
          5 + Math.random() * 5);
      }
      if ((targetR !== undefined && r === targetR && c === targetC) ||
          this.getEntity(r, c) instanceof Wall ||
          this.getEntity(r, c) instanceof Box ||
          this.hasClosedDoor(r, c)) {
        for (let i = 0; i < 10; i++) {
          const angle2 = Math.atan2(-dr, -dc) + (Math.random() - 0.5) * 1.5;
          this.spawnParticle(c * ts + ts / 2, r * ts + ts / 2,
            Math.cos(angle2) * (1 + Math.random() * 3),
            Math.sin(angle2) * (1 + Math.random() * 3),
            '#FF8C00', 15 + Math.random() * 15, 30, 4 + Math.random() * 5);
        }
        break;
      }
      r += dr; c += dc;
    }
  }

  computeThreatenedTiles() {
    if (this.gameOver) return;
    this.threatenedTiles = new Set();
    for (const mon of this.monsters) {
      if (mon instanceof FireDragon) {
        const dr = mon.facing[0], dc = mon.facing[1];
        let r = mon.r + dr, c = mon.c + dc;
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          const e = this.getEntity(r, c);
          if (e instanceof Wall || e instanceof Box || this.hasClosedDoor(r, c)) break;
          if (e instanceof Character && this.isProtectedByPriest(r, c)) {
            this.threatenedTiles.add(r + ',' + c);
            for (const ch of this.characters) {
              if (ch.type === PRIEST) {
                if (ch.r === r && ch.c === c) {
                } else if (Math.abs(ch.r - r) + Math.abs(ch.c - c) === 1) {
                  this.threatenedTiles.add(ch.r + ',' + ch.c);
                }
              }
            }
          }
          if (e) break;
          r += dr; c += dc;
        }
      } else if (mon instanceof Goblin) {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
          const nr = mon.r + dr, nc = mon.c + dc;
          const e = this.getEntity(nr, nc);
          if (e && e instanceof Character && this.isProtectedByPriest(nr, nc)) {
            this.threatenedTiles.add(nr + ',' + nc);
            for (const ch of this.characters) {
              if (ch.type === PRIEST) {
                if (Math.abs(ch.r - nr) + Math.abs(ch.c - nc) === 1) {
                  this.threatenedTiles.add(ch.r + ',' + ch.c);
                }
              }
            }
          }
        }
      }
    }
  }

  updateMonsters() {
    if (this.gameOver) return;
    const attacks = [];
    for (const mon of this.monsters) {
      if (mon instanceof FireDragon) {
        const target = this.scanFireTarget(mon);
        if (target) {
          mon.breathing = true;
          attacks.push({ attacker: mon, target });
        } else {
          mon.breathing = false;
        }
      } else if (mon instanceof Goblin) {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
          const nr = mon.r + dr, nc = mon.c + dc;
          const target = this.getEntity(nr, nc);
          if (target && target !== mon) {
            if (target instanceof Character || target instanceof Monster) {
              attacks.push({ attacker: mon, target });
            }
          }
        }
      }
    }
    const toDestroy = new Set();
    for (const { target } of attacks) {
      toDestroy.add(target);
    }
    for (const { attacker, target } of attacks) {
      if (attacker instanceof FireDragon) {
        this.renderDragonFire(attacker, target.r, target.c);
      }
    }
    const filteredDestroy = [];
    for (const entity of toDestroy) {
      if (entity instanceof Character && this.isProtectedByPriest(entity.r, entity.c)) {
        continue;
      }
      filteredDestroy.push(entity);
    }
    for (const entity of filteredDestroy) {
      if (entity instanceof Character && entity.controllable) {
        this.killCharacter(entity, '⚠ 被怪物攻击了！');
        break;
      } else {
        this.destroyEntity(entity);
      }
    }
  }

  destroyEntity(entity) {
    if (!entity) return;
    const e = this.getEntity(entity.r, entity.c);
    if (e === entity) {
      this.setEntity(entity.r, entity.c, null);
    }
    if (entity instanceof Monster) {
      const idx = this.monsters.indexOf(entity);
      if (idx !== -1) this.monsters.splice(idx, 1);
    }
    if (entity instanceof Character) {
      const idx = this.characters.indexOf(entity);
      if (idx !== -1) this.characters.splice(idx, 1);
    }
    entity.onDestroy(this);
  }

  removeMonster(monster) {
    this.destroyEntity(monster);
  }

  killCharacter(character, reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    character.onDeathParticles(this);
    // 由外部 UI 模块处理 DOM 交互
    if (this.onDeath) {
      this.onDeath(reason);
    }
  }

  // ---- 胜利检测 ----
  checkWin() {
    if (this.won || this.characters.length === 0 || this.targets.length === 0) return;
    const allOn = this.characters.every(ch =>
      this.targets.some(t => t.r === ch.r && t.c === ch.c)
    );
    if (allOn) {
      this.won = true;
      if (this.onWin) {
        this.onWin();
      }
    }
  }

  // ---- 角色相关 ----
  getActiveCharacter() {
    if (this.characters.length === 0) return null;
    if (this.activeCharIdx >= this.characters.length) this.activeCharIdx = 0;
    return this.characters[this.activeCharIdx];
  }

  isProtectedByPriest(r, c) {
    for (const ch of this.characters) {
      if (ch.type === PRIEST) {
        if (ch.r === r && ch.c === c) return true;
        if (Math.abs(ch.r - r) + Math.abs(ch.c - c) === 1) {
          const entity = this.getEntity(r, c);
          if (entity instanceof Character) return true;
        }
      }
    }
    return false;
  }

  // ---- 渲染 ----
  render(ctx) {
    if (!ctx) return;
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, (this.cols * this.tileSize), (this.rows * this.tileSize));
    const ts = this.tileSize;
    const holyTiles = this.threatenedTiles || new Set();

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        drawFloor(ctx, c * ts, r * ts, ts);
        if (holyTiles.has(r + ',' + c)) {
          drawHolyLight(ctx, c * ts, r * ts, ts, 1.0);
        }
        if (this.targets.some(t => t.r === r && t.c === c)) {
          const t = this.targets.find(t => t.r === r && t.c === c);
          t.render(ctx, c * ts, r * ts, ts);
        }
        if (this.switches.some(s => s.r === r && s.c === c)) {
          const sw = this.switches.find(s => s.r === r && s.c === c);
          sw.render(ctx, c * ts, r * ts, ts);
        }
        if (this.doors.some(d => d.r === r && d.c === c)) {
          const door = this.doors.find(d => d.r === r && d.c === c);
          door.render(ctx, c * ts, r * ts, ts);
        }
        if (this.monsterGates.some(g => g.r === r && g.c === c)) {
          const gate = this.monsterGates.find(g => g.r === r && g.c === c);
          gate.render(ctx, c * ts, r * ts, ts);
        }
        const entity = this.getEntity(r, c);
        if (entity) {
          entity.render(ctx, c * ts, r * ts, ts);
        }
        if (this.switches.some(s => s.r === r && s.c === c)) {
          const sw = this.switches.find(s => s.r === r && s.c === c);
          drawSwitchOverlay(ctx, c * ts, r * ts, ts, sw.color, sw.pressed);
        }
      }
    }
    for (let i = 0; i < this.characters.length; i++) {
      const ch = this.characters[i];
      ch.render(ctx, ch.c * ts, ch.r * ts, ts, i !== this.activeCharIdx);
      if (i === this.activeCharIdx) {
        ctx.fillStyle = 'rgba(255,215,0,0.35)';
        ctx.fillRect(ch.c * ts, ch.r * ts + ts - 4, ts, 4);
      }
    }
  }

  renderParticles(ctx) {
    if (!ctx) return;
    ctx.save();
    for (const p of this.particles) {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  // ---- 用于外部模块的 DOM 事件回调 ----
  setDeathCallback(cb) {
    this.onDeath = cb;
  }

  setWinCallback(cb) {
    this.onWin = cb;
  }
}

export { World };