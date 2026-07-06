// ============================================================
// 推箱子 — 渲染/绘制函数
// ============================================================

const canvas = document.getElementById('game');
const gctx = canvas.getContext('2d');

// ---- Drawing Primitives ----
function drawFloor(ctx, x, y, ts) {
  const s = ts / 8;
  ctx.fillStyle = C.floor1;
  ctx.fillRect(x, y, ts, ts);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 0) {
    ctx.fillStyle = C.floor2;
    ctx.fillRect(x + c * s, y + r * s, s, s);
  }
}

function drawWall(ctx, x, y, ts) {
  const s = ts / 8;
  ctx.fillStyle = C.wallDark;
  ctx.fillRect(x, y, ts, ts);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const br = r % 4 < 2, off = r >= 4 ? 2 : 0, col = (c + off) % 8;
    if (br) ctx.fillStyle = (Math.floor(r / 2) + Math.floor(c / 2)) % 2 === 0 ? C.wall2 : C.wall1;
    else ctx.fillStyle = C.wallDark;
    if (br && c === 5 && r < 3) ctx.fillStyle = C.wall3;
    ctx.fillRect(x + col * s, y + r * s, s, s);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(x, y, ts, s);
}

function drawWater(ctx, x, y, ts) {
  const s = ts / 8, t = Date.now() / 1800;
  for (let r = 0; r < 8; r++) {
    const d = 0.7 + (r / 8) * 0.25;
    ctx.fillStyle = `rgba(8,25,55,${d})`;
    ctx.fillRect(x, y + r * s, ts, s);
  }
  for (let r = 0; r < 8; r++) {
    const wp = Math.sin(r * 0.9 + t * 1.2) * 0.5 + 0.5, a = 0.12 + wp * 0.15, h = 210 + wp * 20, off = Math.sin(r * 0.7 + t * 1.5) * 4;
    ctx.fillStyle = `hsla(${h},80%,50%,${a})`;
    ctx.fillRect(x + off, y + r * s, ts, s);
  }
  for (let c = 0; c < 8; c++) {
    const sh = Math.sin(c * 0.6 + t * 1.8) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(60,150,255,${0.04 + sh * 0.08})`;
    ctx.fillRect(x + c * s, y, s, ts);
  }
  for (let i = 0; i < 3; i++) {
    const p = t * (0.6 + i * 0.3) + i * 2.1, ri = ((p % (Math.PI * 2)) / (Math.PI * 2)) * 5, rx = (Math.sin(p * 0.7 + i) * 0.5 + 0.5) * 6, ry = (Math.cos(p * 0.5 + i * 1.3) * 0.5 + 0.5) * 6, ra = 0.12 - ri * 0.02;
    if (ra > 0.01) {
      ctx.strokeStyle = `rgba(150,210,255,${ra})`;
      ctx.lineWidth = s * 0.5;
      ctx.beginPath();
      ctx.arc(x + rx * s + s, y + ry * s + s, ri * s, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  for (let i = 0; i < 4; i++) {
    const sx = (Math.sin(t * 2.9 + i * 1.7) * 0.5 + 0.5) * 6, sy = (Math.cos(t * 2.3 + i * 2.1) * 0.5 + 0.5) * 6, sp = Math.sin(t * 4.1 + i * 3.3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(180,230,255,${sp * 0.25})`;
    ctx.fillRect(x + sx * s, y + sy * s, s * 2, s * 2);
    ctx.fillStyle = `rgba(255,255,255,${sp * 0.15})`;
    ctx.fillRect(x + sx * s + s * 0.25, y + sy * s + s * 0.25, s, s);
  }
}

function drawBox(ctx, x, y, ts) {
  const s = ts / 8;
  ctx.fillStyle = C.boxDark;
  ctx.fillRect(x + s, y + s, ts - s, ts - s);
  ctx.fillStyle = C.box1;
  ctx.fillRect(x, y, ts - s, ts - s);
  ctx.fillStyle = C.box2;
  ctx.fillRect(x + s, y + s * 3, ts - s * 2, s);
  ctx.fillRect(x + s * 3, y + s, s, ts - s * 3);
  ctx.fillStyle = C.box3;
  ctx.fillRect(x + s, y + s, ts - s * 3, s * 2);
  ctx.fillStyle = C.boxDark;
  ctx.fillRect(x + ts / 2 - s / 2, y + s * 3, s, ts - s * 4);
  ctx.fillRect(x + s * 3, y + ts / 2 - s / 2, ts - s * 5, s);
  ctx.strokeStyle = C.box2;
  ctx.lineWidth = s / 2;
  ctx.strokeRect(x + s / 2, y + s / 2, ts - s - s / 2, ts - s - s / 2);
}

function drawTarget(ctx, x, y, ts) {
  drawFloor(ctx, x, y, ts);
  const s = ts / 8, cx = x + ts / 2, cy = y + ts / 2;
  ctx.fillStyle = C.targetGlow;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(cx, cy, ts * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = [C.target2, C.target1, C.targetGlow, C.targetGlow][i];
    ctx.lineWidth = s;
    ctx.beginPath();
    ctx.arc(cx, cy, ts * (0.4 - i * 0.08), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = C.targetGlow;
  ctx.fillRect(cx - s * 2, cy - s * 2, s * 4, s * 4);
  ctx.fillStyle = 'rgba(255,215,0,0.7)';
  ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
  ctx.fillStyle = C.targetGlow;
  ctx.fillRect(cx - s * 0.5, cy - s * 0.5, s, s);
}

function drawChar(ctx, x, y, ts, ch, sleeping) {
  const sp = sleeping ? SPRITES_SLEEP[ch] : SPRITES[ch];
  const s = ts / 10;
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const ch2 = (sp[r] || '')[c] || '.';
    if (ch2 === '.') continue;
    if (ch === PRIEST) {
      if (ch2 === 'y') ctx.fillStyle = C.priestWhite;
      else if (ch2 === 'p') ctx.fillStyle = C.priestGold;
      else if (ch2 === 's') ctx.fillStyle = C.white;
      else ctx.fillStyle = C.priestWhite;
    } else {
      if (ch2 === 'r') ctx.fillStyle = C.wRed;
      else if (ch2 === 's') ctx.fillStyle = C.white;
      else if (ch2 === 'w') ctx.fillStyle = C.wRedD;
      else if (ch2 === 'g') ctx.fillStyle = C.tGrnL;
      else if (ch2 === 't') ctx.fillStyle = C.tGrn;
      else if (ch2 === 'b') ctx.fillStyle = C.mMag;
      else if (ch2 === 'm') ctx.fillStyle = C.mMagL;
      else ctx.fillStyle = C.wRed;
    }
    ctx.fillRect(x + c * s, y + r * s, s, s);
  }
  if (!sleeping) {
    const ey = y + 3 * s, e1 = x + 3.5 * s, e2 = x + 6.5 * s;
    ctx.fillStyle = C.black;
    ctx.fillRect(e1, ey, s * 1.5, s * 1.5);
    ctx.fillRect(e2, ey, s * 1.5, s * 1.5);
    ctx.fillStyle = C.white;
    ctx.fillRect(e1 + s * 0.25, ey + s * 0.25, s * 0.75, s * 0.75);
    ctx.fillRect(e2 + s * 0.25, ey + s * 0.25, s * 0.75, s * 0.75);
  } else {
    const ey = y + 3 * s, e1 = x + 3 * s, e2 = x + 6.5 * s;
    ctx.fillStyle = C.black;
    ctx.fillRect(e1, ey, s * 1.5, s * 0.5);
    ctx.fillRect(e2, ey, s * 1.5, s * 0.5);
  }
}

function drawGoblin(ctx, x, y, ts) {
  const sp = GOBLIN_SPRITE;
  const s = ts / 10;
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const ch2 = (sp[r] || '')[c] || '.';
    if (ch2 === '.') continue;
    if (ch2 === 'g') ctx.fillStyle = '#2d8a4e';
    else if (ch2 === 'd') ctx.fillStyle = '#1a5c33';
    else if (ch2 === 's') ctx.fillStyle = C.white;
    else ctx.fillStyle = '#3ba35e';
    ctx.fillRect(x + c * s, y + r * s, s, s);
  }
  // Red eyes
  const dis = ts / 10;
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(x + 3 * dis, y + 3 * dis, dis * 1.5, dis * 1.5);
  ctx.fillRect(x + 6 * dis, y + 3 * dis, dis * 1.5, dis * 1.5);
  ctx.fillStyle = '#ff6666';
  ctx.fillRect(x + 4 * dis, y + 3.5 * dis, dis * 0.5, dis * 0.5);
  ctx.fillRect(x + 7 * dis, y + 3.5 * dis, dis * 0.5, dis * 0.5);
  // Angry eyebrows
  ctx.fillStyle = '#1a5c33';
  ctx.fillRect(x + 2.5 * dis, y + 2 * dis, dis * 2, dis * 0.5);
  ctx.fillRect(x + 6.5 * dis, y + 2 * dis, dis * 2, dis * 0.5);
}

/** 绘制圣光特效 - 在牧师和他周围一格的地面绘制 */
function drawHolyLight(ctx, x, y, ts, intensity) {
  const t = Date.now() / 800;
  const cx = x + ts / 2, cy = y + ts / 2;
  // 外圈光晕
  const pulse = 0.6 + Math.sin(t + x * 0.3 + y * 0.5) * 0.25;
  ctx.globalAlpha = intensity * pulse * 0.35;
  ctx.fillStyle = C.holyLight1;
  ctx.beginPath();
  ctx.arc(cx, cy, ts * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // 中圈金色
  ctx.globalAlpha = intensity * pulse * 0.25;
  ctx.fillStyle = C.holyLight2;
  ctx.beginPath();
  ctx.arc(cx, cy, ts * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // 内圈白色
  ctx.globalAlpha = intensity * pulse * 0.4;
  ctx.fillStyle = C.holyLight1;
  ctx.beginPath();
  ctx.arc(cx, cy, ts * 0.25, 0, Math.PI * 2);
  ctx.fill();
  // 十字架光效
  const s = ts / 12;
  ctx.globalAlpha = intensity * pulse * 0.5;
  ctx.fillStyle = C.holyLight3;
  ctx.fillRect(cx - s, cy - ts * 0.35, s * 2, ts * 0.7);
  ctx.fillRect(cx - ts * 0.35, cy - s, ts * 0.7, s * 2);
  // 旋转的小光点
  ctx.globalAlpha = intensity * 0.3;
  for (let i = 0; i < 4; i++) {
    const angle = t * 0.7 + i * Math.PI / 2;
    const dist = ts * 0.45;
    const dx = cx + Math.cos(angle) * dist;
    const dy = cy + Math.sin(angle) * dist;
    ctx.fillStyle = C.holyLight1;
    ctx.fillRect(dx - s, dy - s, s * 2, s * 2);
    ctx.fillStyle = C.holyLight2;
    ctx.fillRect(dx - s * 0.5, dy - s * 0.5, s, s);
  }
  ctx.globalAlpha = 1;
}

function drawDoor(ctx, x, y, ts, color, open) {
  const s = ts / 8;
  if (open) {
    drawFloor(ctx, x, y, ts);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x, y, ts, ts);
    ctx.strokeStyle = color === 0 ? C.doorP : C.doorY;
    ctx.lineWidth = s;
    ctx.setLineDash([s * 2, s]);
    ctx.strokeRect(x + s * 1.5, y + s * 1.5, ts - s * 3, ts - s * 3);
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 600 + color) * 0.15;
    ctx.fillStyle = color === 0 ? C.doorP : C.doorY;
    ctx.fillRect(x + s * 2, y + s * 2, ts - s * 4, s);
    ctx.fillRect(x + s * 2, y + ts - s * 3, ts - s * 4, s);
    ctx.fillRect(x + s * 2, y + s * 2, s, ts - s * 4);
    ctx.fillRect(x + ts - s * 3, y + s * 2, s, ts - s * 4);
    ctx.globalAlpha = 1;
  } else {
    let c1, c2, c3;
    if (color === 0) { c1 = C.doorPdark; c2 = C.doorP; c3 = '#AF7AC5'; }
    else { c1 = C.doorYdark; c2 = C.doorY; c3 = '#F9E79F'; }
    ctx.fillStyle = c1;
    ctx.fillRect(x, y, ts, ts);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      ctx.fillStyle = (Math.floor(r / 2) + Math.floor(c / 2)) % 2 === 0 ? c2 : c1;
      ctx.fillRect(x + c * s, y + r * s, s, s);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x, y, ts, s);
    ctx.fillRect(x, y, s * 1.5, s * 1.5);
    ctx.fillRect(x + ts - s * 1.5, y, s * 1.5, s * 1.5);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = s / 2;
    ctx.strokeRect(x + s / 2, y + s / 2, ts - s, ts - s);
  }
}

function drawDragon(ctx, x, y, ts, dir, breathing) {
  drawFloor(ctx, x, y, ts);
  const sp = DRAGON_SPRITES[dir];
  const s = ts / 10;
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const ch2 = (sp[r] || '')[c] || '.';
    if (ch2 === '.') continue;
    if (ch2 === 'd') ctx.fillStyle = '#5C0000';  // 暗红色躯干
    else if (ch2 === 'l') ctx.fillStyle = '#8B1A1A'; // 亮红色鳞片/四肢
    else if (ch2 === 'h') ctx.fillStyle = '#2A0000'; // 角/棘刺
    else if (ch2 === 'f') ctx.fillStyle = '#FF4500'; // 尾巴火焰
    else ctx.fillStyle = '#5C0000';
    ctx.fillRect(x + c * s, y + r * s, s, s);
  }
  // Glowing eyes — position varies by direction (0=up,1=right,2=down,3=left)
  const dis = s;
  // 喷火时眼睛更亮
  ctx.fillStyle = breathing ? '#FFFF00' : '#CCFF00';
  if (dir === 0) {
    // 朝上: 头部在第2-3行，dd区域在col 4-5
    ctx.fillRect(x + 4 * dis, y + 2 * dis, dis, dis);
    ctx.fillRect(x + 5 * dis, y + 2 * dis, dis, dis);
    ctx.fillStyle = '#FFFBE6';
    ctx.fillRect(x + 4 * dis + 0.25 * dis, y + 2.5 * dis, dis * 0.5, dis * 0.5);
    ctx.fillRect(x + 5 * dis + 0.25 * dis, y + 2.5 * dis, dis * 0.5, dis * 0.5);
  } else if (dir === 1) {
    ctx.fillRect(x + 7 * dis, y + 2 * dis, dis, dis);
    ctx.fillStyle = '#FFFBE6';
    ctx.fillRect(x + 7 * dis + 0.25 * dis, y + 2.5 * dis, dis * 0.5, dis * 0.5);
  } else if (dir === 2) {
    ctx.fillRect(x + 4 * dis, y + 7 * dis, dis, dis);
    ctx.fillRect(x + 5 * dis, y + 7 * dis, dis, dis);
    ctx.fillStyle = '#FFFBE6';
    ctx.fillRect(x + 4 * dis + 0.25 * dis, y + 7.5 * dis, dis * 0.5, dis * 0.5);
    ctx.fillRect(x + 5 * dis + 0.25 * dis, y + 7.5 * dis, dis * 0.5, dis * 0.5);
  } else {
    ctx.fillRect(x + 2 * dis, y + 2 * dis, dis, dis);
    ctx.fillStyle = '#FFFBE6';
    ctx.fillRect(x + 2 * dis + 0.25 * dis, y + 2.5 * dis, dis * 0.5, dis * 0.5);
  }
  // 喷火时在前方绘制火焰光晕
  if (breathing) {
    const dr = [0, -1, 0, 1][dir], dc = [1, 0, -1, 0][dir];
    const fx = x + ts/2 + dc * ts * 0.7;
    const fy = y + ts/2 + dr * ts * 0.7;
    ctx.fillStyle = '#FF4500';
    ctx.globalAlpha = 0.4 + Math.random() * 0.3;
    ctx.beginPath();
    ctx.arc(fx, fy, ts * (0.25 + Math.random() * 0.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFDD00';
    ctx.globalAlpha = 0.2 + Math.random() * 0.2;
    ctx.beginPath();
    ctx.arc(fx, fy, ts * (0.15 + Math.random() * 0.15), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/** 怪物门 - 品红色能量门，只有当场上所有怪物都死亡时才开启 */
function drawMonsterGate(ctx, x, y, ts, open) {
  const s = ts / 8;
  if (open) {
    drawFloor(ctx, x, y, ts);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x, y, ts, ts);
    // 品红色发光边框
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = s;
    ctx.setLineDash([s * 2, s]);
    ctx.strokeRect(x + s * 1.5, y + s * 1.5, ts - s * 3, ts - s * 3);
    ctx.setLineDash([]);
    // 脉冲品红色光晕
    const pulse = 0.3 + Math.sin(Date.now() / 500) * 0.2;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#E91E63';
    ctx.fillRect(x + s * 2, y + s * 2, ts - s * 4, s);
    ctx.fillRect(x + s * 2, y + ts - s * 3, ts - s * 4, s);
    ctx.fillRect(x + s * 2, y + s * 2, s, ts - s * 4);
    ctx.fillRect(x + ts - s * 3, y + s * 2, s, ts - s * 4);
    // 中央骷髅图标表示"怪物"死亡条件
    ctx.fillStyle = '#E91E63';
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 600) * 0.2;
    ctx.font = `${ts * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💀', x + ts/2, y + ts/2);
    ctx.globalAlpha = 1;
  } else {
    // 关闭状态 — 品红色实体门
    let c1 = '#880E4F', c2 = '#E91E63', c3 = '#F48FB1';
    ctx.fillStyle = c1;
    ctx.fillRect(x, y, ts, ts);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      ctx.fillStyle = (Math.floor(r / 2) + Math.floor(c / 2)) % 2 === 0 ? c2 : c1;
      ctx.fillRect(x + c * s, y + r * s, s, s);
    }
    // 品红色骷髅标记
    ctx.fillStyle = '#F48FB1';
    ctx.globalAlpha = 0.6;
    ctx.font = `${ts * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💀', x + ts/2, y + ts/2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, ts, s);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = s / 2;
    ctx.strokeRect(x + s / 2, y + s / 2, ts - s, ts - s);
  }
}

/** 在实体上层画开关指示（简洁角落标记，不遮挡怪物） */
function drawSwitchOverlay(ctx, x, y, ts, color, pressed) {
  const s = ts / 8, clr = color === 0 ? C.switchP : C.switchY;
  // 四个角落小方块标记（固定在格子角落，不会被实体挡住）
  const cSize = pressed ? s * 1.2 : s * 0.8;
  ctx.fillStyle = clr;
  ctx.globalAlpha = pressed ? 0.7 : 0.35;
  ctx.fillRect(x + 1, y + 1, cSize, cSize);
  ctx.fillRect(x + ts - cSize - 1, y + 1, cSize, cSize);
  ctx.fillRect(x + 1, y + ts - cSize - 1, cSize, cSize);
  ctx.fillRect(x + ts - cSize - 1, y + ts - cSize - 1, cSize, cSize);
  ctx.globalAlpha = 1;
  // 细边框提示
  ctx.strokeStyle = clr;
  ctx.lineWidth = pressed ? s * 0.8 : s * 0.5;
  ctx.globalAlpha = pressed ? 0.4 : 0.15;
  ctx.strokeRect(x + s, y + s, ts - s * 2, ts - s * 2);
  ctx.globalAlpha = 1;
}

function drawSwitch(ctx, x, y, ts, color, pressed) {
  drawFloor(ctx, x, y, ts);
  const s = ts / 8, cx = x + ts / 2, cy = y + ts / 2, clr = color === 0 ? C.switchP : C.switchY;
  if (pressed) {
    // 触发状态：四角彩色方块 + 细边框
    const cSize = s * 1.2;
    ctx.fillStyle = clr;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x + 1, y + 1, cSize, cSize);
    ctx.fillRect(x + ts - cSize - 1, y + 1, cSize, cSize);
    ctx.fillRect(x + 1, y + ts - cSize - 1, cSize, cSize);
    ctx.fillRect(x + ts - cSize - 1, y + ts - cSize - 1, cSize, cSize);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = clr;
    ctx.lineWidth = s * 0.8;
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(x + s, y + s, ts - s * 2, ts - s * 2);
    ctx.globalAlpha = 1;
  } else {
    // 未触发状态：保留原小圆
    ctx.fillStyle = clr;
    ctx.globalAlpha = 0.12 + Math.sin(Date.now() / 800 + color) * 0.06;
    ctx.beginPath();
    ctx.arc(cx, cy, ts * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = clr;
    ctx.lineWidth = s * 0.8;
    ctx.setLineDash([s * 1.5, s]);
    ctx.beginPath();
    ctx.arc(cx, cy, ts * 0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = clr;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
