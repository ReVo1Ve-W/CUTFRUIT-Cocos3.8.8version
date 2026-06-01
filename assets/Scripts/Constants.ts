export const COLLISION_TAG = {
    KNIFE: 50,
    FLOOR: 100,
} as const;

export const TIMING = {
    WAVE_CREATE_DELAY: 0.5,
    JUICE_FADE_DURATION: 1.5,
    ROTATE_DURATION: 7,
    GAME_OVER_DELAY: 0.5,
    FLASH_DURATION: 0.8,
    GAME_OVER_TWEEN: 0.4,
    FADE_OUT_TWEEN: 0.3,
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
