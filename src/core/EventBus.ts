import Phaser from 'phaser';
import type { ViewportInfo } from './ResponsiveScaler';

/**
 * Single seam between the Phaser game and the DOM interface. Scenes emit facts
 * ("assets loaded", "viewport changed"); the UI layer listens. Neither side
 * reaches into the other's internals.
 */
export const GameEvents = {
  LOAD_PROGRESS: 'load-progress',
  ASSETS_REPORT: 'assets-report',
  GAME_READY: 'game-ready',
  VIEWPORT_CHANGED: 'viewport-changed',
  FATAL_ERROR: 'fatal-error',
} as const;

export interface AssetReportEntry {
  key: string;
  path: string;
  expectedWidth: number;
  expectedHeight: number;
  actualWidth: number | null;
  actualHeight: number | null;
  status: 'ok' | 'size-mismatch' | 'failed';
  note: string;
}

export interface AssetReport {
  entries: AssetReportEntry[];
}

export interface FatalErrorPayload {
  title: string;
  message: string;
  details?: string[];
}

export type { ViewportInfo };

export const eventBus = new Phaser.Events.EventEmitter();
