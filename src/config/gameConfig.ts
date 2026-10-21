import Phaser from 'phaser';
import { NAVY_CSS } from './constants';
import type { ViewportInfo } from '../core/ResponsiveScaler';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { WorldScene } from '../scenes/WorldScene';

export function createGameConfig(
  parent: HTMLElement,
  viewport: ViewportInfo,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: NAVY_CSS,
    // Initial logical size. ResponsiveScaler keeps it in sync afterwards.
    width: viewport.logicalWidth,
    height: viewport.logicalHeight,
    banner: false,
    disableContextMenu: true,
    render: {
      pixelArt: true, // nearest-neighbour texture filtering
      antialias: false,
      roundPixels: true,
    },
    scale: {
      // The ResponsiveScaler owns sizing. Phaser must not stretch the canvas.
      mode: Phaser.Scale.NONE,
      zoom: viewport.cssScale,
      autoRound: false,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    input: {
      activePointers: 3,
    },
    scene: [BootScene, PreloadScene, WorldScene],
  };
}
