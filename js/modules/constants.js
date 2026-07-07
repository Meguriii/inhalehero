// ============================================================
// 常量与精灵数据 — ES Module
// ============================================================

// ---- Tile Constants ----
export const EMPTY = 0, WALL = 1, BOX = 2, TARGET = 3, WATER = 6;
export const DOOR_PURPLE = 10, DOOR_YELLOW = 11, DOOR_MAGENTA = 12;
export const SWITCH_PURPLE = 20, SWITCH_YELLOW = 21;
export const WARRIOR = 0, THIEF = 1, MAGE = 2, PRIEST = 3;
export const GOBLIN = 40;
export const FIRE_DRAGON = 41;
export const CHAR_TILE_BASE = 30;
export const CH_NAMES = ['⚔ 战士', '🗝 盗贼', '✦ 法师', '✝ 牧师'];
export const CH_ICONS = ['⚔', '🗝', '✦', '✝'];
export const TILE_CHARS = { 0: '.', 1: 'W', 2: 'X', 3: 'T', 6: '~', 10: 'P', 11: 'Y', 12: 'M', 20: 'p', 21: 'y', 40: 'G', 41: 'F' };
export const GOBLIN_NAME = '👺 哥布林';
export const GOBLIN_ICON = '👺';
export const GOBLIN_SPRITE = [
  ".gggg..", ".gggggg.", "gggggggg", "gsssgssg", "gggdggdgg", "gggggggg", "gggggggg", "gggggggg", "..ssss..", "........"
];
export const DRAGON_NAME = '🐉 火龙';
export const DRAGON_ICON = '🐉';
export const MONSTER_GATE_NAME = '🚧 怪物门';
export const MONSTER_GATE_ICON = '🚧';
export const DRAGON_SPRITES = [
  [
    "....hh....",
    "....dd....",
    "...lddl...",
    "...lddl...",
    "....dd....",
    "..dddddd..",
    ".lddddddl.",
    ".lddddddl.",
    "..dddddd..",
    "...ffff..."
  ],
  [
    "..........",
    "....hhhhh.",
    "....ddddl.",
    "....ddddl.",
    "....dddd..",
    "...dddd...",
    "..lddd....",
    "..ldddl...",
    "..dddd....",
    "..ffff...."
  ],
  [
    "...ffff...",
    "..dddddd..",
    ".lddddddl.",
    ".lddddddl.",
    "..dddddd..",
    "....dd....",
    "...lddl...",
    "...lddl...",
    "....dd....",
    "....hh...."
  ],
  [
    "..........",
    ".hhhhh....",
    ".ldddd....",
    ".ldddd....",
    "..dddd....",
    "...dddd...",
    "....dddl..",
    "...ldddl..",
    "....dddd..",
    "....ffff.."
  ]
];

export const C = {
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
  doorM: '#E91E63', doorMdark: '#880E4F',
  switchP: '#AF7AC5', switchY: '#F9E79F',
  priestWhite: '#F0F0FF', priestWhiteD: '#D0D0E0',
  priestGold: '#FFD700', priestGoldD: '#DAA520',
  holyLight1: '#FFFDE7', holyLight2: '#FFD54F', holyLight3: '#FFE082',
};

export const SPRITES = [
  [".wwww..", ".wrrrrw.", "wrrrrrrw", "wrrsrsw", "wrrrrrrw", "wrrrrrrw", "wrrwrrw", "wsrrsrrw", ".s....s.", "..ssss.."],
  [".tttt..", ".tggggt.", "tggggggt", "tgtsttgt", "tggggggt", "tggggggt", "tggtggt", "tsttstt", ".s....s.", "..ssss.."],
  [".bbbb..", ".bbbbbb.", "bbbbbbbb", "bbmsmbb", "bbbbbbbb", "bbbbbbbb", "bbmbbmb", "msbmsbm", ".s....s.", "..ssss.."],
  [".yyyy..", ".yppppy.", "yppppppy", "yppspy", "yppppppy", "yppppppy", "ypppypp", "yppspyp", ".s....s.", "..ssss.."]
];

export const SPRITES_SLEEP = [
  [".wwww..", ".wrrrrw.", "wrrrrrrw", "wrrrrrrw", "wrrrrrrw", "wrrrrrrw", "wrrwrrw", "wsrrsrrw", ".s....s.", "..ssss.."],
  [".tttt..", ".tggggt.", "tggggggt", "tggggggt", "tggggggt", "tggggggt", "tggtggt", "tsttstt", ".s....s.", "..ssss.."],
  [".bbbb..", ".bbbbbb.", "bbbbbbbb", "bbbbbbbb", "bbbbbbbb", "bbbbbbbb", "bbmbbmb", "msbmsbm", ".s....s.", "..ssss.."],
  [".yyyy..", ".yppppy.", "yppppppy", "yppppppy", "yppppppy", "yppppppy", "ypppypp", "yppspyp", ".s....s.", "..ssss.."]
];