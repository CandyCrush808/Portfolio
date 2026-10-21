import * as Phaser from 'phaser';
import { PLAYER } from '../config/constants';
import { eventBus, GameEvents } from '../core/EventBus';
import { GUIDE_DIALOGUE } from '../data/portfolioData';
import { soundEffects } from '../audio/SoundEffects';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  private readonly promptIcon: Phaser.GameObjects.Container;
  private readonly promptTween: Phaser.Tweens.Tween;
  public readonly id: string;
  public readonly label: string;
  public readonly interactionDistance = 75;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id = 'guide',
    label = 'Rowan the Guide'
  ) {
    // Uses frame 0 with a gentle golden sage tint to distinguish from player
    super(scene, x, y - PLAYER.FOOT_OFFSET_Y, 'player-atlas', 0);
    this.id = id;
    this.label = label;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body so player cannot walk through
    this.setScale(PLAYER.SCALE).setDepth(y).setTint(0xf7d88c);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(PLAYER.BODY_WIDTH, PLAYER.BODY_HEIGHT);
    body.setOffset(PLAYER.BODY_OFFSET_X, PLAYER.BODY_OFFSET_Y);

    // Create floating pixel speech indicator above head
    const bubbleBg = scene.add.graphics();
    bubbleBg.fillStyle(0x183d32, 0.95);
    bubbleBg.lineStyle(2, 0xf2c96d, 1);
    bubbleBg.fillRoundedRect(-14, -14, 28, 22, 4);
    bubbleBg.strokeRoundedRect(-14, -14, 28, 22, 4);
    // Little pointer triangle
    bubbleBg.fillTriangle(0, 8, -4, 12, 4, 12);

    const iconText = scene.add.text(0, -3, '!', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f2c96d',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.promptIcon = scene.add.container(x, y - 65, [bubbleBg, iconText]);
    this.promptIcon.setDepth(y + 20);

    // Gentle floating bob animation
    this.promptTween = scene.tweens.add({
      targets: this.promptIcon,
      y: y - 72,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  updatePlayerDistance(playerFoot: Phaser.Math.Vector2): boolean {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerFoot.x, playerFoot.y);
    const inRange = dist <= this.interactionDistance;

    // Face the player if in range
    if (inRange) {
      if (playerFoot.x < this.x - 10) {
        this.setFlipX(true);
      } else if (playerFoot.x > this.x + 10) {
        this.setFlipX(false);
      }
    }

    return inRange;
  }

  interact(): void {
    soundEffects.playInteract();
    eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
      id: 'talk-guide',
      title: 'Meet Rowan the Guide',
    });
    eventBus.emit(GameEvents.START_DIALOGUE, {
      lines: GUIDE_DIALOGUE,
    });
  }

  destroy(fromScene?: boolean): void {
    this.promptTween.stop();
    this.promptIcon.destroy();
    super.destroy(fromScene);
  }
}
