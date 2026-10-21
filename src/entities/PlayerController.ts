import Phaser from 'phaser';
import { PLAYER } from '../config/constants';
import { Facing, PlayerAnimations } from './PlayerAnimations';

export class PlayerController extends Phaser.Physics.Arcade.Sprite {
  facing: Facing = 'down';
  private moving = false;
  private readonly foot = new Phaser.Math.Vector2();

  constructor(scene: Phaser.Scene, spawn: {x:number;y:number}) {
    super(scene, spawn.x, spawn.y - PLAYER.FOOT_OFFSET_Y, 'player-atlas', PlayerAnimations.idleFrame('down'));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(PLAYER.SCALE).setDepth(spawn.y).setCollideWorldBounds(true).setFlipX(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER.BODY_WIDTH, PLAYER.BODY_HEIGHT);
    body.setOffset(PLAYER.BODY_OFFSET_X, PLAYER.BODY_OFFSET_Y);
    body.setMaxSpeed(PLAYER.SPEED);
    PlayerAnimations.register(scene);
  }

  updateMovement(direction: Phaser.Math.Vector2): void {
    const moving = direction.lengthSq() > 0;
    if (moving) {
      if (Math.abs(direction.x) > Math.abs(direction.y)) this.facing = direction.x < 0 ? 'left' : 'right';
      else this.facing = direction.y < 0 ? 'up' : 'down';
      this.setVelocity(direction.x * PLAYER.SPEED, direction.y * PLAYER.SPEED);
    } else {
      this.setVelocity(0, 0);
    }

    this.setFlipX(this.facing === 'left');
    const key = `player-walk-${this.facing}`;
    if (moving) {
      if (!this.anims.isPlaying || this.anims.currentAnim?.key !== key) this.anims.play(key, true);
    } else if (this.moving || Number(this.frame.name) !== PlayerAnimations.idleFrame(this.facing)) {
      this.anims.stop();
      this.setFrame(PlayerAnimations.idleFrame(this.facing));
    }
    this.moving = moving;
    this.setDepth(this.y + PLAYER.FOOT_OFFSET_Y);
  }

  get isMoving(): boolean { return this.moving; }
  get footPoint(): Phaser.Math.Vector2 {
    const body=this.body as Phaser.Physics.Arcade.Body;
    return this.foot.set(body.center.x,body.bottom);
  }
}
