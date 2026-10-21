import './ui/styles.css';
import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';
import { eventBus, GameEvents } from './core/EventBus';
import { ResponsiveScaler } from './core/ResponsiveScaler';
import { guardNonCancelableTouchCancel } from './input/touchCancelGuard';
import { UIShell } from './ui/UIShell';

function boot(): void {
  const gameRoot = document.getElementById('game-root');
  const uiRoot = document.getElementById('ui-root');
  if (!gameRoot || !uiRoot) {
    throw new Error('PixelQuest: #game-root or #ui-root is missing from index.html');
  }

  const ui = new UIShell(uiRoot);
  ui.bind();

  // Anything that escapes during startup becomes a friendly error screen.
  // After the game is running, errors only go to the console.
  const reportStartupError = (reason: unknown): void => {
    console.error('[PixelQuest] Unhandled error', reason);
    if (ui.isGameReady) return;
    eventBus.emit(GameEvents.FATAL_ERROR, {
      title: 'Something went wrong',
      message: 'The game could not start. Reloading may help.',
      details: [reason instanceof Error ? reason.message : String(reason)],
    });
  };
  window.addEventListener('error', (event) => reportStartupError(event.error ?? event.message));
  window.addEventListener('unhandledrejection', (event) => reportStartupError(event.reason));

  guardNonCancelableTouchCancel(gameRoot);

  const initial = ResponsiveScaler.measure(gameRoot);
  const game = new Phaser.Game(createGameConfig(gameRoot, initial));
  new ResponsiveScaler(game, gameRoot).start(initial);

  // Test hook, only when opened with ?debug (used by manual / automated checks).
  if (new URLSearchParams(window.location.search).has('debug')) {
    window.__PIXELQUEST__ = { game };
  }
}

try {
  boot();
} catch (error) {
  console.error('[PixelQuest] Boot failed', error);
  const message = error instanceof Error ? error.message : String(error);
  document.getElementById('splash-status')!.textContent = `Could not start: ${message}`;
}
