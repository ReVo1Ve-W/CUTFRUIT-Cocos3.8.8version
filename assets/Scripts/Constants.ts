export const COLLISION_TAG = {
    KNIFE: 50,
    FLOOR: 100,
} as const;

export const TIMING = {
    WAVE_CREATE_DELAY: 0.5,
    WAVE_DELAY_MIN: 0.3,
    WAVE_DELAY_MAX: 1.5,
    STAGGER_MIN: 0.04,
    STAGGER_MAX: 0.2,
    JUICE_FADE_DURATION: 1.5,
    ROTATE_DURATION: 7,
    GAME_OVER_DELAY: 0.5,
    FLASH_DURATION: 0.8,
    GAME_OVER_TWEEN: 0.4,
    FADE_OUT_TWEEN: 0.3,
} as const;

export const THROW = {
    // 速度缩放系数 — 调这个就够了，越大飞越高
    SPEED_SCALE: 0.04,
    // 顶点高度 = 屏幕高度 × 比例（范围）
    APEX_RATIO_MIN: 0.55,
    APEX_RATIO_MAX: 0.78,
    // 水平散布边距
    SPREAD_MARGIN: 80,
    // 旋转速度范围
    ANG_VEL_MIN: 30,
    ANG_VEL_MAX: 180,
} as const;

export const WAVE = {
    COUNT_MIN: 2,
    COUNT_MAX: 6,
    MAX_BOMBS: 2,
} as const;

export const SCORE = {
    PENALTY_MULTIPLIER: 2,
    MAX_LIVES: 3,
} as const;

export const POOL = {
    FRUIT_JUICE_SIZE: 20,
} as const;

export const BOMB_FLASH = {
    INITIAL_OPACITY: 230,
} as const;

export const PHYSICS = {
    GRAVITY_Y: -320,
} as const;
