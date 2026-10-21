import Phaser from 'phaser';
import { assetUrl, ESSENTIAL_IMAGES } from '../config/assetManifest';
import { SCENE_KEYS } from '../config/constants';
import { preloadVillageAssets, WORLD_REQUIRED_TEXTURES } from '../world/WorldBuilder';
import {
  type AssetReport,
  type AssetReportEntry,
  eventBus,
  GameEvents,
} from '../core/EventBus';

/**
 * Loads every essential asset through its real path, then verifies what the
 * browser decoded against the audited manifest. Progress and errors are
 * reported to the DOM loading screen through the event bus; this scene draws
 * nothing itself.
 */
export class PreloadScene extends Phaser.Scene {
  private readonly failedKeys = new Set<string>();

  constructor() {
    super(SCENE_KEYS.PRELOAD);
  }

  preload(): void {
    this.failedKeys.clear();

    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      eventBus.emit(GameEvents.LOAD_PROGRESS, value);
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      this.failedKeys.add(file.key);
      console.error(`[PixelQuest] Failed to load asset "${file.key}" from ${file.url}`);
    });

    for (const asset of ESSENTIAL_IMAGES) {
      this.load.image(asset.key, assetUrl(asset.path));
    }
    preloadVillageAssets(this);
  }

  create(): void {
    const entries: AssetReportEntry[] = ESSENTIAL_IMAGES.map((asset) => {
      const base = {
        key: asset.key,
        path: asset.path,
        expectedWidth: asset.width,
        expectedHeight: asset.height,
        note: asset.note,
      };

      if (this.failedKeys.has(asset.key) || !this.textures.exists(asset.key)) {
        return { ...base, actualWidth: null, actualHeight: null, status: 'failed' as const };
      }

      const source = this.textures.get(asset.key).getSourceImage() as HTMLImageElement;
      const actualWidth = source.width;
      const actualHeight = source.height;
      const matches = actualWidth === asset.width && actualHeight === asset.height;
      if (!matches) {
        console.warn(
          `[PixelQuest] "${asset.key}" is ${actualWidth}x${actualHeight} but the manifest ` +
            `expects ${asset.width}x${asset.height}. Re-audit before using it.`,
        );
      }
      return {
        ...base,
        actualWidth,
        actualHeight,
        status: matches ? ('ok' as const) : ('size-mismatch' as const),
      };
    });

    const report: AssetReport = { entries };
    eventBus.emit(GameEvents.ASSETS_REPORT, report);

    const failed = entries.filter((entry) => entry.status === 'failed');
    if (failed.length > 0) {
      eventBus.emit(GameEvents.FATAL_ERROR, {
        title: 'Could not load the game',
        message: 'Some essential files failed to load. Check your connection and reload.',
        details: failed.map((entry) => `${entry.key} (${entry.path})`),
      });
      return;
    }

    const failedWorld = WORLD_REQUIRED_TEXTURES.filter(key => this.failedKeys.has(key) || !this.textures.exists(key));
    if (failedWorld.length > 0) {
      eventBus.emit(GameEvents.FATAL_ERROR, {
        title: 'Could not load the village',
        message: 'Some world or player assets could not be loaded. Check the listed files and reload.',
        details: failedWorld,
      });
      return;
    }

    this.scene.start(SCENE_KEYS.WORLD);
  }
}
