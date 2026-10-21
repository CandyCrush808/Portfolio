import Phaser from 'phaser';

export class KeyboardInput {
  private readonly keys: Record<'W'|'A'|'S'|'D'|'UP'|'DOWN'|'LEFT'|'RIGHT', Phaser.Input.Keyboard.Key> | null;
  private readonly captured: number[];
  private readonly onBlur = (): void => this.reset();

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    this.keys = keyboard ? keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as typeof this.keys : null;
    this.captured = [Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT, Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.D];
    keyboard?.addCapture(this.captured);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.onBlur);
    scene.game.events.on(Phaser.Core.Events.HIDDEN, this.onBlur);
  }

  getVector(out: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    out.set(0,0);
    if (!this.keys) return out;
    const k=this.keys;
    if(k.A.isDown||k.LEFT.isDown) out.x--;
    if(k.D.isDown||k.RIGHT.isDown) out.x++;
    if(k.W.isDown||k.UP.isDown) out.y--;
    if(k.S.isDown||k.DOWN.isDown) out.y++;
    return out;
  }

  destroy(): void {
    this.scene.game.events.off(Phaser.Core.Events.BLUR,this.onBlur);
    this.scene.game.events.off(Phaser.Core.Events.HIDDEN,this.onBlur);
    this.scene.input.keyboard?.removeCapture(this.captured);
    this.reset();
  }

  private reset(): void { this.keys && Object.values(this.keys).forEach(k=>k.reset()); }
}
