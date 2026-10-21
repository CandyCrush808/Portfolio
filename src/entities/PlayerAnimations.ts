import * as Phaser from 'phaser';

export type Facing = 'down' | 'up' | 'left' | 'right';

const WALK_FRAMES: Record<Facing, number[]> = {
  // Direction assignments were checked against the normalized contact preview:
  // row 0 faces down, row 1 faces away/up, row 2 c0-c1 is the right-facing profile.
  down: [0, 1, 2, 3],
  up: [4, 5, 6, 7],
  right: [8, 9],
  left: [8, 9], // mirrored right-facing profile
};

export class PlayerAnimations {
  static register(scene: Phaser.Scene): void {
    for (const [facing, frames] of Object.entries(WALK_FRAMES) as Array<[Facing, number[]]>) {
      const key = `player-walk-${facing}`;
      if (!scene.anims.exists(key)) {
        scene.anims.create({
          key,
          frames: frames.map((frame) => ({ key: 'player-atlas', frame })),
          frameRate: 7,
          repeat: -1,
        });
      }
    }
  }

  static idleFrame(facing: Facing): number {
    return WALK_FRAMES[facing][0]!;
  }
}
