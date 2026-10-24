export const GAME_TITLE = 'PixelQuest';

/** Logical tile edge in game pixels. Matches the 16-bit style target in design.md. */
export const TILE_SIZE = 16;

/**
 * Viewport policy (see core/ResponsiveScaler.ts).
 *
 * The canvas is always an integer number of device pixels per logical pixel,
 * so pixel art is never stretched or blurred. The zoom is the largest integer
 * that still shows at least MIN_LOGICAL_* of the world, capped so very large
 * monitors reveal more world instead of enormous pixels.
 */
export const VIEW = {
  MIN_LOGICAL_WIDTH: 192,
  MIN_LOGICAL_HEIGHT: 108,
  /** Maximum CSS pixels per logical pixel. */
  MAX_CSS_SCALE: 4,
} as const;

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  WORLD: 'WorldScene',
} as const;

/** Keys of textures generated in code (not loaded from art files). */
export const TEXTURE_KEYS = {
  PLACEHOLDER_PLAYER: 'placeholder-player',
  FLOOR: 'test-floor',
  TREE: 'test-tree',
  ROCK: 'test-rock',
} as const;

export const PLAYER = {
  /** Pixels per second in world coordinates. */
  SPEED: 110,
  SCALE: 0.35,
  BODY_WIDTH: 40,
  BODY_HEIGHT: 20,
  BODY_OFFSET_X: 52,
  BODY_OFFSET_Y: 148,
  FOOT_OFFSET_Y: 84,
  /** Pointer steering stops when this close to the pointer (world px). */
  POINTER_DEADZONE: 4,
} as const;

/** design.md colour tokens as Phaser numbers. */
export const COLORS = {
  navy: 0x17172f,
  panel: 0x222443,
  cream: 0xfff0cc,
  gold: 0xf4c75b,
  wood: 0x69402f,
  blue: 0x69b8f0,
  green: 0x83d17b,
  red: 0xe85d5d,
  grass: 0x75b85a,
  path: 0xb8a58a,
} as const;

export const NAVY_CSS = '#17172F';
