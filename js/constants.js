// ============================================================
// 推箱子 — 常量与精灵数据
// ============================================================

// ---- Tile Constants ----
const EMPTY = 0, WALL = 1, BOX = 2, TARGET = 3, WATER = 6;
const DOOR_PURPLE = 10, DOOR_YELLOW = 11, DOOR_MAGENTA = 12;
const SWITCH_PURPLE = 20, SWITCH_YELLOW = 21;
const WARRIOR = 0, THIEF = 1, MAGE = 2, PRIEST = 3;
const GOBLIN = 40;
const FIRE_DRAGON = 41;
const CHAR_TILE_BASE = 30;
const CH_NAMES = ['⚔ 战士', '🗝 盗贼', '✦ 法师', '✝ 牧师'];
const CH_ICONS = ['⚔', '🗝', '✦', '✝'];
const TILE_CHARS = { 0: '.', 1: 'W', 2: 'X', 3: 'T', 6: '~', 10: 'P', 11: 'Y', 12: 'M', 20: 'p', 21: 'y', 40: 'G', 41: 'F' };
const GOBLIN_NAME = '👺 哥布林';
const GOBLIN_ICON = '👺';
const GOBLIN_SPRITE = [
  ".gggg..", ".gggggg.", "gggggggg", "gsssgssg", "gggdggdgg", "gggggggg", "gggggggg", "gggggggg", "..ssss..", "........"
];
const DRAGON_NAME = '🐉 火龙';
const DRAGON_ICON = '🐉';
const MONSTER_GATE_NAME = '🚧 怪物门';
const MONSTER_GATE_ICON = '🚧';
// Fire Dragon sprites: 4 directions (0=up, 1=right, 2=down, 3=left)
//   d = dark red body    #5C0000  (躯干主色)
//   l = lighter red       #8B1A1A  (鳞片/四肢亮色)
//   h = horn/spike        #2A0000  (角/棘刺)
//   f = flame             #FF4500  (尾巴火焰)
//   e = eye position (单独绘制)
const DRAGON_SPRITES = [
  // ======== Up (0) ========
  // 头部朝上，小而紧凑。前肢在身体中上部两侧撑起，后肢在身体下部两侧蹲坐。
  // 尾巴从底部蜿蜒盘绕到胯下，尾尖喷火。
  [
    "....hh....",   // 0 - 小角
    "....dd....",   // 1 - 头顶
    "...lddl...",   // 2 - 脸（眼睛在dd区域外侧绘制）
    "...lddl...",   // 3 - 脸颊/下颚
    "....dd....",   // 4 - 脖颈
    "..dddddd..",   // 5 - 上半身展开
    ".lddddddl.",   // 6 - 前肢向两侧撑起
    ".lddddddl.",   // 7 - 后肢蹲坐两侧
    "..dddddd..",   // 8 - 尾巴盘绕于身下
    "...ffff..."    // 9 - 尾尖火焰
  ],
  // ======== Right (1) ========
  // 头部朝右，小巧。身体水平延伸。前肢在身体前半部下方向前撑地，
  // 后肢在身体后半部下方向后蹲坐。尾巴向左伸展并盘卷，尾端喷火。
  [
    "..........",   // 0
    "....hhhhh.",   // 1 - 头上角
    "....ddddl.",   // 2 - 小头 + 眼睛 (在d最右处)
    "....ddddl.",   // 3 - 下颚
    "....dddd..",   // 4 - 脖颈
    "...dddd...",   // 5 - 胸部，前肢起始
    "..lddd....",   // 6 - 前肢(l)撑起 + 身体
    "..ldddl...",   // 7 - 后肢(l)蹲坐 + 身体
    "..dddd....",   // 8 - 尾巴向左延展盘卷
    "..ffff...."    // 9 - 尾焰
  ],
  // ======== Down (2) ========
  // 头部朝下（正面俯视），与Up镜像。角在下方，火焰在上方（尾巴盘绕到上方喷火）。
  [
    "...ffff...",   // 0 - 尾尖火焰（在上方）
    "..dddddd..",   // 1 - 尾巴盘绕
    ".lddddddl.",   // 2 - 后肢蹲坐两侧
    ".lddddddl.",   // 3 - 前肢撑起两侧
    "..dddddd..",   // 4 - 身体
    "....dd....",   // 5 - 脖颈
    "...lddl...",   // 6 - 脸颊/下颚
    "...lddl...",   // 7 - 脸（眼睛在dd区域外侧绘制）
    "....dd....",   // 8 - 头顶
    "....hh...."    // 9 - 小角
  ],
  // ======== Left (3) ========
  // 头部朝左，与Right镜像。前肢向左前方撑地，后肢向左后方蹲坐。
  [
    "..........",   // 0
    ".hhhhh....",   // 1 - 头上角
    ".ldddd....",   // 2 - 小头 + 眼睛 (在d最左处)
    ".ldddd....",   // 3 - 下颚
    "..dddd....",   // 4 - 脖颈
    "...dddd...",   // 5 - 胸部，前肢起始
    "....dddl..",   // 6 - 前肢(l)撑起 + 身体
    "...ldddl..",   // 7 - 后肢(l)蹲坐 + 身体
    "....dddd..",   // 8 - 尾巴向右延展盘卷
    "....ffff.."    // 9 - 尾焰
  ]
];

const C = {
  wall1: '#3a3a5a', wall2: '#4a4a6a', wall3: '#5a5a7a', wallDark: '#2a2a4a',
  floor1: '#2a2a40', floor2: '#303048',
  box1: '#8B5A2B', box2: '#6B3A1B', box3: '#A07040', boxDark: '#4A2A10',
  target1: '#FFD700', target2: '#DAA520', targetGlow: '#FFEE88',
  wRed: '#E74C3C', wRedD: '#C0392B', wRedL: '#FF6B6B',
  tGrn: '#2ECC71', tGrnD: '#27AE60', tGrnL: '#82E0AA',
  mMag: '#3498DB', mMagD: '#2980B9', mMagL: '#85C1E9',
  black: '#1a1a2e', white: '#e8e8f0',
  doorP: '#9B59B6', doorY: '#F1C40F',
  doorPdark: '#5B2C6F', doorYdark: '#B7950B',
  doorM: '#E91E63', doorMdark: '#880E4F',  // 品红色门
  switchP: '#AF7AC5', switchY: '#F9E79F',
  // Priest colors
  priestWhite: '#F0F0FF', priestWhiteD: '#D0D0E0',
  priestGold: '#FFD700', priestGoldD: '#DAA520',
  holyLight1: '#FFFDE7', holyLight2: '#FFD54F', holyLight3: '#FFE082',
};

const SPRITES = [
  [".wwww..", ".wrrrrw.", "wrrrrrrw", "wrrsrsw", "wrrrrrrw", "wrrrrrrw", "wrrwrrw", "wsrrsrrw", ".s....s.", "..ssss.."],
  [".tttt..", ".tggggt.", "tggggggt", "tgtsttgt", "tggggggt", "tggggggt", "tggtggt", "tsttstt", ".s....s.", "..ssss.."],
  [".bbbb..", ".bbbbbb.", "bbbbbbbb", "bbmsmbb", "bbbbbbbb", "bbbbbbbb", "bbmbbmb", "msbmsbm", ".s....s.", "..ssss.."],
  [".yyyy..", ".yppppy.", "yppppppy", "yppspy", "yppppppy", "yppppppy", "ypppypp", "yppspyp", ".s....s.", "..ssss.."]
];

const SPRITES_SLEEP = [
  [".wwww..", ".wrrrrw.", "wrrrrrrw", "wrrrrrrw", "wrrrrrrw", "wrrrrrrw", "wrrwrrw", "wsrrsrrw", ".s....s.", "..ssss.."],
  [".tttt..", ".tggggt.", "tggggggt", "tggggggt", "tggggggt", "tggggggt", "tggtggt", "tsttstt", ".s....s.", "..ssss.."],
  [".bbbb..", ".bbbbbb.", "bbbbbbbb", "bbbbbbbb", "bbbbbbbb", "bbbbbbbb", "bbmbbmb", "msbmsbm", ".s....s.", "..ssss.."],
  [".yyyy..", ".yppppy.", "yppppppy", "yppppppy", "yppppppy", "yppppppy", "ypppypp", "yppspyp", ".s....s.", "..ssss.."]
];