import * as Phaser from 'phaser';
import { PLAYER, TEXTURE_KEYS } from '../config/constants';

/**
 * Phase 1 placeholder player: a procedurally drawn sprite with Arcade physics.
 * The real player (animated from the supplied sheet) arrives in Phase 3 after
 * the frame grid has been audited.
 */
export class TestPlayer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE_KEYS.PLACEHOLDER_PLAYER);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // Collision body hugs the feet, not the whole 16x16 frame.
    this.body!.setSize(PLAYER.BODY_WIDTH, PLAYER.BODY_HEIGHT);
    this.body!.setOffset(PLAYER.BODY_OFFSET_X, PLAYER.BODY_OFFSET_Y);
  }

  /** `direction` components are in [-1, 1]; diagonals are already normalised. */
  setMovement(direction: Phaser.Math.Vector2): void {
    this.setVelocity(direction.x * PLAYER.SPEED, direction.y * PLAYER.SPEED);
  }
}
