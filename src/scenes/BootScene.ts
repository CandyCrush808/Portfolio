import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { createPlaceholderTextures } from '../utils/placeholderTextures';

/** Starts the pipeline: builds code-generated textures, then hands over to loading. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  create(): void {
    createPlaceholderTextures(this);
    this.scene.start(SCENE_KEYS.PRELOAD);
  }
}
