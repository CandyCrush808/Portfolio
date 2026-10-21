import type Phaser from 'phaser';
import { COLORS, TEXTURE_KEYS, TILE_SIZE } from '../config/constants';

/**
 * Procedural stand-ins used only by the Phase 1 test scene. They exist so the
 * scene can run without touching, slicing or assuming anything about the
 * supplied artwork (which has not been audited into sprites yet).
 */
export function createPlaceholderTextures(scene: Phaser.Scene): void {
  const textures = scene.textures;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  if (!textures.exists(TEXTURE_KEYS.PLACEHOLDER_PLAYER)) {
    g.clear();
    // 16x16: head, tunic, boots. Feet sit at the bottom of the frame.
    g.fillStyle(0x3b2a1e).fillRect(5, 1, 6, 2); // hair
    g.fillStyle(COLORS.cream).fillRect(5, 3, 6, 4); // face
    g.fillStyle(COLORS.navy).fillRect(6, 4, 1, 1).fillRect(9, 4, 1, 1); // eyes
    g.fillStyle(COLORS.blue).fillRect(4, 7, 8, 5); // tunic
    g.fillStyle(COLORS.gold).fillRect(4, 10, 8, 1); // belt
    g.fillStyle(COLORS.wood).fillRect(4, 12, 3, 3).fillRect(9, 12, 3, 3); // boots
    g.generateTexture(TEXTURE_KEYS.PLACEHOLDER_PLAYER, 16, 16);
  }

  if (!textures.exists(TEXTURE_KEYS.TREE)) {
    g.clear();
    g.fillStyle(0x2f6b3a).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x3f8a4a).fillRect(2, 1, 12, 10);
    g.fillStyle(0x56a85f).fillRect(4, 2, 5, 4);
    g.fillStyle(COLORS.wood).fillRect(6, 11, 4, 5);
    g.generateTexture(TEXTURE_KEYS.TREE, TILE_SIZE, TILE_SIZE);
  }

  if (!textures.exists(TEXTURE_KEYS.ROCK)) {
    g.clear();
    g.fillStyle(0x6e6e80).fillRect(1, 3, 14, 11);
    g.fillStyle(0x9a9aae).fillRect(3, 4, 6, 3);
    g.fillStyle(0x4a4a5c).fillRect(1, 12, 14, 2);
    g.generateTexture(TEXTURE_KEYS.ROCK, TILE_SIZE, TILE_SIZE);
  }

  g.destroy();
}
