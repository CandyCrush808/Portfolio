import * as Phaser from 'phaser';
import { eventBus, GameEvents } from '../core/EventBus';
import { soundEffects } from '../audio/SoundEffects';

type Direction = 'up' | 'down' | 'left' | 'right';
interface Button { direction: Direction; x: number; y: number; size: number }
interface ActionBtn { x: number; y: number; size: number }

/** Responsive Phaser-rendered mobile touch overlay with D-pad and Action button. */
export class TouchControls {
  private readonly visible: boolean;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly buttons: Button[] = [];
  private interactBtn: ActionBtn | null = null;
  private readonly active = new Map<number, Direction | null>();
  private interactPointerId: number | null = null;
  private interactAvailable = false;
  private readonly movement = new Phaser.Math.Vector2();

  private readonly onPointerDown = (p: Phaser.Input.Pointer): void => this.begin(p);
  private readonly onPointerMove = (p: Phaser.Input.Pointer): void => this.move(p);
  private readonly onPointerUp = (p: Phaser.Input.Pointer): void => this.end(p);
  private readonly onReset = (): void => {
    this.active.clear();
    this.interactPointerId = null;
    this.draw();
  };

  private readonly onHint = (payload: { text: string | null; key: string } | null): void => {
    this.interactAvailable = Boolean(payload && payload.text);
    this.draw();
  };

  constructor(private readonly scene: Phaser.Scene) {
    this.visible = scene.sys.game.device.input.touch || new URLSearchParams(window.location.search).has('touchControls');
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(10000);

    if (this.visible) {
      scene.game.canvas.addEventListener('touchcancel', this.onReset);
      scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown);
      scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove);
      scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp);
      scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp);
      scene.input.on(Phaser.Input.Events.GAME_OUT, this.onReset);
      scene.game.events.on(Phaser.Core.Events.BLUR, this.onReset);
      scene.game.events.on(Phaser.Core.Events.HIDDEN, this.onReset);
      scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

      eventBus.on(GameEvents.INTERACTION_HINT, this.onHint, this);

      this.layout();
    }
  }

  getVector(out = this.movement): Phaser.Math.Vector2 {
    out.set(0, 0);
    for (const dir of this.active.values()) {
      if (dir === 'left') out.x--;
      if (dir === 'right') out.x++;
      if (dir === 'up') out.y--;
      if (dir === 'down') out.y++;
    }
    return out.lengthSq() > 1 ? out.normalize() : out;
  }

  destroy(): void {
    eventBus.off(GameEvents.INTERACTION_HINT, this.onHint, this);
    const input = this.scene.input;
    input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown);
    input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove);
    input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp);
    input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp);
    input.off(Phaser.Input.Events.GAME_OUT, this.onReset);
    this.scene.game.canvas.removeEventListener('touchcancel', this.onReset);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.onReset);
    this.scene.game.events.off(Phaser.Core.Events.HIDDEN, this.onReset);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.graphics.destroy();
    this.active.clear();
  }

  private layout(): void {
    this.buttons.length = 0;
    this.graphics.clear();
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const cssScale = this.scene.game.canvas.getBoundingClientRect().width / Math.max(1, w);
    const rootStyle = getComputedStyle(document.documentElement);
    const safeLeft = (parseFloat(rootStyle.getPropertyValue('--pq-safe-left')) || 0) / cssScale;
    const safeRight = (parseFloat(rootStyle.getPropertyValue('--pq-safe-right')) || 0) / cssScale;
    const safeBottom = (parseFloat(rootStyle.getPropertyValue('--pq-safe-bottom')) || 0) / cssScale;

    const size = Math.max(28, Math.min(44, Math.round(w * 0.115)));
    const left = safeLeft + 16 + size / 2;
    const down = h - safeBottom - 16 - size / 2;
    const centerY = down - size;

    this.buttons.push(
      { direction: 'up', x: left + size, y: centerY - size, size },
      { direction: 'left', x: left, y: centerY, size },
      { direction: 'right', x: left + size * 2, y: centerY, size },
      { direction: 'down', x: left + size, y: centerY + size, size },
    );

    // Large contextual action button on the bottom right
    const actSize = Math.max(48, Math.min(64, Math.round(size * 1.5)));
    const actX = w - safeRight - 20 - actSize / 2;
    const actY = h - safeBottom - 20 - actSize / 2;
    this.interactBtn = { x: actX, y: actY, size: actSize };

    this.draw();
  }

  private draw(): void {
    this.graphics.clear();

    // 1. Draw D-pad buttons
    for (const b of this.buttons) {
      const pressed = [...this.active.values()].includes(b.direction);
      this.graphics.fillStyle(pressed ? 0x83d17b : 0x222443, 0.82).lineStyle(2, 0xfff0cc, 0.9);
      this.graphics.fillRoundedRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size, 6);
      this.graphics.strokeRoundedRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size, 6);
      this.graphics.fillStyle(0xfff0cc, 1);
      const s = b.size * 0.2;
      const x = b.x;
      const y = b.y;
      if (b.direction === 'up') this.graphics.fillTriangle(x, y - s * 1.35, x - s, y + s, x + s, y + s);
      if (b.direction === 'down') this.graphics.fillTriangle(x, y + s * 1.35, x - s, y - s, x + s, y - s);
      if (b.direction === 'left') this.graphics.fillTriangle(x - s * 1.35, y, x + s, y - s, x + s, y + s);
      if (b.direction === 'right') this.graphics.fillTriangle(x + s * 1.35, y, x - s, y - s, x - s, y + s);
    }

    // 2. Draw Contextual Action Button
    if (this.interactBtn) {
      const b = this.interactBtn;
      const pressed = this.interactPointerId !== null;
      const highlight = this.interactAvailable;

      const fillColor = pressed ? 0xf2c96d : (highlight ? 0x183d32 : 0x222443);
      const strokeColor = highlight ? 0xf2c96d : 0xfff0cc;
      const strokeWidth = highlight ? 3 : 2;

      this.graphics.fillStyle(fillColor, 0.88).lineStyle(strokeWidth, strokeColor, 0.95);
      this.graphics.fillCircle(b.x, b.y, b.size / 2);
      this.graphics.strokeCircle(b.x, b.y, b.size / 2);

      // Inner decorative ring
      this.graphics.lineStyle(1, strokeColor, 0.5);
      this.graphics.strokeCircle(b.x, b.y, b.size / 2 - 4);

      // Center symbol / label (draw a stylized gem or action icon)
      this.graphics.fillStyle(pressed ? 0x102820 : (highlight ? 0xf2c96d : 0xfff0cc), 1);
      const r = b.size * 0.22;
      // Diamond icon
      this.graphics.fillTriangle(b.x, b.y - r, b.x - r, b.y, b.x + r, b.y);
      this.graphics.fillTriangle(b.x, b.y + r, b.x - r, b.y, b.x + r, b.y);
    }
  }

  private begin(p: Phaser.Input.Pointer): void {
    // Check Action button first
    if (this.interactBtn) {
      const dist = Phaser.Math.Distance.Between(p.x, p.y, this.interactBtn.x, this.interactBtn.y);
      if (dist <= this.interactBtn.size / 2 + 8) {
        this.interactPointerId = p.id;
        soundEffects.playInteract();
        eventBus.emit(GameEvents.INTERACT_ACTION);
        this.draw();
        return;
      }
    }

    const dir = this.hit(p.x, p.y);
    if (!dir) return;
    this.active.set(p.id, dir);
    this.draw();
  }

  private move(p: Phaser.Input.Pointer): void {
    if (this.interactPointerId === p.id) {
      // Still dragging over action button or moved off
      return;
    }
    if (!this.active.has(p.id)) return;
    this.active.set(p.id, p.isDown ? this.hit(p.x, p.y) : null);
    this.draw();
  }

  private end(p: Phaser.Input.Pointer): void {
    if (this.interactPointerId === p.id) {
      this.interactPointerId = null;
      this.draw();
    }
    if (this.active.delete(p.id)) {
      this.draw();
    }
  }

  private hit(x: number, y: number): Direction | null {
    for (const b of this.buttons) {
      if (Math.abs(x - b.x) <= b.size / 2 + 4 && Math.abs(y - b.y) <= b.size / 2 + 4) {
        return b.direction;
      }
    }
    return null;
  }
}
