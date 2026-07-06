// ============================================================
// World — 游戏世界核心（实体网格、移动、交互、状态管理）
// ============================================================

class World {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.grid = [];    // grid[r][c] = Entity instance | null (只存储有碰撞/行为的实体)
    this.characters = [];  // Character 数组（可控角色）
    this.targets = [];     // Target 数组（不放入grid，单独追踪）
    this.switches = [];    // Switch 数组（不放入grid，单独追踪）
    this.doors = [];       // Door 数组（不放入grid，单独追踪，但受碰撞）
    this.monsterGates = [];  // MonsterGate 数组
    this.monsters = [];    // Monster 数组（放入grid）
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

  /** 是否有门（无论开关状态） */
  hasDoorAt(r, c) {
    return this.doors.some(d => d.r === r && d.c === c) ||
           this.monsterGates.some(g => g.r === r && g.c === c);
  }

  /** 是否有关闭的门（碰撞障碍） */
  hasClosedDoor(r, c) {
    return this.doors.some(d => d.r === r && d.c === c && !d.active) ||
           this.monsterGates.some(g => g.r === r && g.c === c && !g.open);
  }

  /** 是否有开启的门 */
  hasOpenDoor(r, c) {
    return this.doors.some(d => d.r === r && d.c === c && d.active) ||
           this.monsterGates.some(g => g.r === r && g.c === c && g.open);
  }

  isWalkable(r, c) {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return false;
    // 关闭的门/怪物门阻路
    if (this.hasClosedDoor(r, c)) return false;
    const e = this.getEntity(r, c);
    if (!e) return true;
    return e.isWalkable();
  }

  isSolid(r, c) {
    // 关闭的门/怪物门是实心的
    if (this.hasClosedDoor(r, c)) return true;
    const e = this.getEntity(r, c);
    if (!e) return false;
    return e.isSolid();
  }

  // ---- 目标/开关/门查询（用于渲染） ----
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
      const speed = 0.5 + Math.random() * 1.5;
      this.spawnParticle(bx + Math.random() * 4 - 2, by + Math.random() * 4 - 2,
        Math.cos(angle) * speed, Math.sin(angle) * speed - 0.5,
        Math.random() < 0.5 ? mageColor : mageColor2, 15, 25, 2 + Math.random() * 3);
    }
    for (let p of [[x1, y1], [x2, y2]]) {
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        this.spawnParticle(p[0], p[1], Math.cos(angle) * speed, Math.sin(angle) * speed - 1,
          starColors[Math.floor(Math.random() * starColors.length)], 12, 27, 1.5 + Math.random() * 3);
      }
    }
  }

  // ---- 移动（纯移动，不触发门/怪物状态更新，由外部调用）----
  moveEntityTo(entity, nr, nc) {
    if (!entity) return false;
    if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) return false;
    if (!this.isWalkable(nr, nc)) return false;
    const target = this.getEntity(nr, nc);
    if (target && target.isSolid()) return false;
    // 保存旧位置
    const or = entity.r, oc = entity.c;
    this.grid[or][oc] = null;
    // 新位置
    entity.r = nr; entity.c = nc;
    this.grid[nr][nc] = entity;
    // 触发 onStepOn（目标实体响应）
    if (target) {
      target.onStepOn(this, entity);
    }
    return true;
  }

  // ---- 状态同步（在完整移动完成后调用） ----
  syncState() {
    this.updateMonsters();      // 先结算怪物伤害（可能杀死怪物）
    this.updateDoorStates();    // 再刷新门状态（怪物死后的开关状态立即生效）
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
      // 墙或关闭的门 → 不可推
      if (entity instanceof Wall || this.hasClosedDoor(r, c)) return null;
      // 不可推的实体（由 canBePushed 决定，角色现在也可被推动）
      if (!entity.canBePushed()) return null;
      chain.push(entity);
      r += dr; c += dc;
    }
    // 检查链末端位置可走
    if (!this.isWalkable(r, c) || this.hasClosedDoor(r, c)) return null;
    return chain;
  }

  executePushChain(chain, dr, dc, pusher) {
    const pr = pusher.r, pc = pusher.c;
    this.grid[pr][pc] = null;
    // 从后往前推
    for (let i = chain.length - 1; i >= 0; i--) {
      const entity = chain[i];
      const nr = entity.r + dr, nc = entity.c + dc;
      // 检查目标格是否有硬障碍（墙、关闭的门）
      if (this.hasClosedDoor(nr, nc) || this.getEntity(nr, nc) instanceof Wall) {
        this.grid[entity.r][entity.c] = null;
        entity.onDestroy(this);
        continue;
      }
      const target = this.getEntity(nr, nc);
      if (target && target !== pusher && target.isSolid()) {
        return false;
      }
      // 清空原位 → 移动到新位
      this.grid[entity.r][entity.c] = null;
      this.grid[nr][nc] = entity;
      entity.r = nr; entity.c = nc;
    }
    // 推的人走入空出的第一个位置
    const fr = pr + dr, fc = pc + dc;
    this.grid[fr][fc] = pusher;
    pusher.r = fr; pusher.c = fc;
    return true;
  }

  // ---- 门状态更新 ----
  updateDoorStates() {
    // 收集开关状态
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

    // 每种颜色：全部按下才开启
    const allPressed = { 0: false, 1: false };
    for (let c of [0, 1]) {
      if (swTotal[c] > 0 && swPressed[c] === swTotal[c]) {
        allPressed[c] = true;
      }
    }

    // 应用门状态变化
    for (let door of this.doors) {
      const wasActive = door.active;
      const nowActive = allPressed[door.color] || false;
      door.active = nowActive;

      // 门从开→关：检查门格上是否有实体被夹
      if (wasActive && !nowActive && !this.gameOver) {
        const occupant = this.getEntity(door.r, door.c);
        if (occupant) {
          if (occupant instanceof Character && occupant.controllable) {
            this.setEntity(door.r, door.c, null);
            this.gameOver = true;
            this.killCharacter(occupant, '⚠ 能量门夹死了角色！');
          } else {
            this.destroyEntity(occupant);  // 完整销毁（移除数组 + 粒子）
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
      // 门从开→关：检查门格上是否有实体被夹
      if (wasOpen && !shouldOpen && !this.gameOver) {
        const occupant = this.getEntity(gate.r, gate.c);
        if (occupant) {
          this.setEntity(gate.r, gate.c, null);
          if (occupant instanceof Character && occupant.controllable) {
            this.gameOver = true;
            this.killCharacter(occupant, '⚠ 怪物门夹死了角色！');
          } else {
            occupant.onDestroy(this);
          }
        }
      }
    }
  }

  // ---- 怪物逻辑（统一结算） ----
  /** 火龙喷火：沿 facing 方向扫描，返回路径上最近的一个生物（不销毁实体） */
  scanFireTarget(dragon) {
    const dr = dragon.facing[0], dc = dragon.facing[1];
    let r = dragon.r + dr, c = dragon.c + dc;
    while (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      // 墙、关闭的门、箱子阻挡火焰
      const e = this.getEntity(r, c);
      if (e instanceof Wall || e instanceof Box || this.hasClosedDoor(r, c)) break;
      if (e instanceof Character) return e;
      if (e instanceof Monster && e !== dragon) return e;
      r += dr; c += dc;
    }
    return null;
  }

  /** 为火龙渲染火焰粒子效果（沿 facing 方向到 target 或边界/障碍） */
  renderDragonFire(dragon, targetR, targetC) {
    const ts = this.tileSize;
    const dr = dragon.facing[0], dc = dragon.facing[1];
    let r = dragon.r + dr, c = dragon.c + dc;
    let hitWall = false;
    while (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      // 粒子 — 更多、更大、更持久
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
      // 到达目标位置或障碍停止
      if ((targetR !== undefined && r === targetR && c === targetC) ||
          this.getEntity(r, c) instanceof Wall ||
          this.getEntity(r, c) instanceof Box ||
          this.hasClosedDoor(r, c)) {
        if (this.getEntity(r, c) instanceof Wall ||
            this.getEntity(r, c) instanceof Box ||
            this.hasClosedDoor(r, c)) {
          hitWall = true;
        }
        // 终点喷溅粒子 — 更粗更大
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

  /** 计算受怪物攻击威胁的格子（用于圣光渲染，每帧调用） */
  computeThreatenedTiles() {
    if (this.gameOver) return;
    this.threatenedTiles = new Set();

    for (const mon of this.monsters) {
      if (mon instanceof FireDragon) {
        // 火龙：沿 facing 方向扫描，路径上所有活物都会受威胁
        const dr = mon.facing[0], dc = mon.facing[1];
        let r = mon.r + dr, c = mon.c + dc;
        while (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          const e = this.getEntity(r, c);
          if (e instanceof Wall || e instanceof Box || this.hasClosedDoor(r, c)) break;
          if (e instanceof Character && this.isProtectedByPriest(r, c)) {
            this.threatenedTiles.add(r + ',' + c);
            // 也标记提供保护的牧师格
            for (const ch of this.characters) {
              if (ch.type === PRIEST) {
                if (ch.r === r && ch.c === c) {
                  // 被攻击的是牧师自己
                } else if (Math.abs(ch.r - r) + Math.abs(ch.c - c) === 1) {
                  this.threatenedTiles.add(ch.r + ',' + ch.c);
                }
              }
            }
          }
          if (e) break; // 遇到任何实体（包括角色和怪物）停止
          r += dr; c += dc;
        }
      } else if (mon instanceof Goblin) {
        // 哥布林：相邻四格
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
          const nr = mon.r + dr, nc = mon.c + dc;
          const e = this.getEntity(nr, nc);
          if (e && e instanceof Character && this.isProtectedByPriest(nr, nc)) {
            this.threatenedTiles.add(nr + ',' + nc);
            // 标记提供保护的牧师格
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

  /**
   * 统一怪物伤害结算：
   *   1. 所有怪物计算自己的攻击目标
   *   2. 收集所有目标到死亡名单
   *   3. 统一销毁/处决
   *   无特判，仅根据每类怪物的攻击方式决定目标
   */
  updateMonsters() {
    if (this.gameOver) return;

    // ---- Phase 1: 收集所有攻击 (attacker → target) ----
    const attacks = [];

    for (const mon of this.monsters) {
      if (mon instanceof FireDragon) {
        // 火龙：沿 facing 方向喷火
        const target = this.scanFireTarget(mon);
        if (target) {
          mon.breathing = true;
          attacks.push({ attacker: mon, target });
        } else {
          mon.breathing = false;
        }
      } else if (mon instanceof Goblin) {
        // 哥布林：攻击相邻的所有活物（角色或其他怪物）
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

    // ---- Phase 2: 统一死亡名单（Set 去重） ----
    const toDestroy = new Set();
    for (const { target } of attacks) {
      toDestroy.add(target);
    }

    // ---- Phase 3: 渲染火龙火焰粒子 ----
    for (const { attacker, target } of attacks) {
      if (attacker instanceof FireDragon) {
        this.renderDragonFire(attacker, target.r, target.c);
      }
    }

    // ---- Phase 5: 过滤受牧师保护的实体 ----
    const filteredDestroy = [];
    for (const entity of toDestroy) {
      // 检查是否受圣光保护（仅限角色）
      if (entity instanceof Character && this.isProtectedByPriest(entity.r, entity.c)) {
        continue; // 跳过被保护的角色
      }
      filteredDestroy.push(entity);
    }

    // ---- Phase 5: 统一处决 ----
    for (const entity of filteredDestroy) {
      if (entity instanceof Character && entity.controllable) {
        this.killCharacter(entity, '⚠ 被怪物攻击了！');
        // gameOver 已设为 true，停止后续处理
        break;
      } else {
        this.destroyEntity(entity);
      }
    }
  }

  /** 销毁任意实体（从grid和对应数组移除，触发粒子） */
  destroyEntity(entity) {
    if (!entity) return;
    // 从grid移除
    const e = this.getEntity(entity.r, entity.c);
    if (e === entity) {
      this.setEntity(entity.r, entity.c, null);
    }
    // 从对应数组移除
    if (entity instanceof Monster) {
      const idx = this.monsters.indexOf(entity);
      if (idx !== -1) this.monsters.splice(idx, 1);
    }
    if (entity instanceof Character) {
      const idx = this.characters.indexOf(entity);
      if (idx !== -1) this.characters.splice(idx, 1);
    }
    if (entity instanceof Box) {
      // 箱子不存数组，不需要移除
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
    document.getElementById('deathReason').textContent = reason;
    document.getElementById('deathOverlay').classList.add('show');
  }

  // ---- 胜利检测 ----
  checkWin() {
    if (this.won || this.characters.length === 0 || this.targets.length === 0) return;
    const allOn = this.characters.every(ch =>
      this.targets.some(t => t.r === ch.r && t.c === ch.c)
    );
    if (allOn) {
      this.won = true;
      document.getElementById('victoryText').textContent = '所有角色都站到了终点！';
      document.getElementById('victoryOverlay').classList.add('show');
    }
  }

  // ---- 角色相关 ----
  getActiveCharacter() {
    if (this.characters.length === 0) return null;
    if (this.activeCharIdx >= this.characters.length) this.activeCharIdx = 0;
    return this.characters[this.activeCharIdx];
  }

  /** 检查某格是否受到牧师的圣光保护 */
  isProtectedByPriest(r, c) {
    for (const ch of this.characters) {
      if (ch.type === PRIEST) {
        // 牧师自身受保护
        if (ch.r === r && ch.c === c) return true;
        // 牧师上下左右相邻一格的角色受保护（四方向，不含对角线）
        if (Math.abs(ch.r - r) + Math.abs(ch.c - c) === 1) {
          // 只保护角色（Character），不保护怪物或其他
          const entity = this.getEntity(r, c);
          if (entity instanceof Character) return true;
        }
      }
    }
    return false;
  }

  // ---- 渲染（分层：地板 → 圣光 → 终点 → 开关 → 门 → grid实体 → 角色） ----
  render() {
    gctx.fillStyle = C.black;
    gctx.fillRect(0, 0, canvas.width, canvas.height);
    const ts = this.tileSize;
    // 圣光渲染：computeThreatenedTiles() 每帧在动画循环中更新
    const holyTiles = this.threatenedTiles || new Set();

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // 1. 地板
        drawFloor(gctx, c * ts, r * ts, ts);
        // 1b. 圣光（当有受保护的格子被怪物威胁时持续显示）
        if (holyTiles.has(r + ',' + c)) {
          drawHolyLight(gctx, c * ts, r * ts, ts, 1.0);
        }
        // 2. 终点
        if (this.targets.some(t => t.r === r && t.c === c)) {
          const t = this.targets.find(t => t.r === r && t.c === c);
          t.render(gctx, c * ts, r * ts, ts);
        }
        // 3. 开关
        if (this.switches.some(s => s.r === r && s.c === c)) {
          const sw = this.switches.find(s => s.r === r && s.c === c);
          sw.render(gctx, c * ts, r * ts, ts);
        }
        // 4. 门（不存入grid，单独渲染）
        if (this.doors.some(d => d.r === r && d.c === c)) {
          const door = this.doors.find(d => d.r === r && d.c === c);
          door.render(gctx, c * ts, r * ts, ts);
        }
        // 4b. 怪物门
        if (this.monsterGates.some(g => g.r === r && g.c === c)) {
          const gate = this.monsterGates.find(g => g.r === r && g.c === c);
          gate.render(gctx, c * ts, r * ts, ts);
        }
        // 5. grid实体（墙、箱子、怪物）
        const entity = this.getEntity(r, c);
        if (entity) {
          entity.render(gctx, c * ts, r * ts, ts);
        }
        // 5b. 如果该格有开关，在实体上层画开关指示圈（半透明光晕，不遮挡实体）
        if (this.switches.some(s => s.r === r && s.c === c)) {
          const sw = this.switches.find(s => s.r === r && s.c === c);
          drawSwitchOverlay(gctx, c * ts, r * ts, ts, sw.color, sw.pressed);
        }
      }
    }
    // 6. 角色（最后绘制，在最上层）
    for (let i = 0; i < this.characters.length; i++) {
      const ch = this.characters[i];
      ch.render(gctx, ch.c * ts, ch.r * ts, ts, i !== this.activeCharIdx);
      if (i === this.activeCharIdx) {
        gctx.fillStyle = 'rgba(255,215,0,0.35)';
        gctx.fillRect(ch.c * ts, ch.r * ts + ts - 4, ts, 4);
      }
    }
  }

  // ---- 粒子更新 ----
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

  renderParticles() {
    gctx.save();
    for (const p of this.particles) {
      const a = p.life / p.maxLife;
      gctx.globalAlpha = a;
      gctx.fillStyle = p.color;
      gctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    gctx.restore();
  }
}