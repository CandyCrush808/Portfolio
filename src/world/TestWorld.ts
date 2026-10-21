import * as Phaser from 'phaser';
import { COLORS, TEXTURE_KEYS, TILE_SIZE } from '../config/constants';

export interface TestWorld {
  width: number;
  height: number;
  spawn: { x: number; y: number };
  blockers: Phaser.Physics.Arcade.StaticGroup;
}

const COLUMNS = 64;
const ROWS = 40;

/** Tiny deterministic PRNG so the test floor looks the same every run. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A throwaway arena for verifying scaling, camera bounds, movement and
 * collision. It is sized larger than the largest viewport the scaler can
 * produce, so camera clamping is always exercised. The real village (Phase 3)
 * replaces this.
 */
export function buildTestWorld(scene: Phaser.Scene): TestWorld {
  const width = COLUMNS * TILE_SIZE;
  const height = ROWS * TILE_SIZE;

  // Floor: two greens in a checker pattern with speckles, baked to one texture.
  const rand = mulberry32(1337);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      g.fillStyle((row + col) % 2 === 0 ? COLORS.grass : 0x6fae54);
      g.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      if (rand() < 0.35) {
        g.fillStyle(0x5f9f48);
        g.fillRect(col * TILE_SIZE + Math.floor(rand() * 13), row * TILE_SIZE + Math.floor(rand() * 13), 2, 2);
      }
    }
  }
  g.generateTexture(TEXTURE_KEYS.FLOOR, width, height);
  g.destroy();
  scene.add.image(0, 0, TEXTURE_KEYS.FLOOR).setOrigin(0, 0);

  const blockers = scene.physics.add.staticGroup();
  const place = (col: number, row: number, key: string): void => {
    blockers
      .create(col * TILE_SIZE, row * TILE_SIZE, key)
      .setOrigin(0, 0)
      .refreshBody();
  };

  // Border of trees.
  for (let col = 0; col < COLUMNS; col++) {
    place(col, 0, TEXTURE_KEYS.TREE);
    place(col, ROWS - 1, TEXTURE_KEYS.TREE);
  }
  for (let row = 1; row < ROWS - 1; row++) {
    place(0, row, TEXTURE_KEYS.TREE);
    place(COLUMNS - 1, row, TEXTURE_KEYS.TREE);
  }

  // A wall of rocks with a one-tile gap, to test squeezing through openings.
  for (let col = 10; col < 30; col++) {
    if (col !== 20) place(col, 12, TEXTURE_KEYS.ROCK);
  }
  // A few loose rocks and a small grove.
  [[34, 8], [35, 8], [34, 9], [44, 20], [45, 20], [45, 21], [14, 26], [15, 26], [15, 27]].forEach(
    ([col, row]) => place(col!, row!, TEXTURE_KEYS.ROCK),
  );
  [[40, 28], [41, 28], [42, 28], [40, 29], [42, 29], [50, 10], [51, 11]].forEach(([col, row]) =>
    place(col!, row!, TEXTURE_KEYS.TREE),
  );

  return {
    width,
    height,
    spawn: { x: 20 * TILE_SIZE + TILE_SIZE / 2, y: 16 * TILE_SIZE },
    blockers,
  };
}
