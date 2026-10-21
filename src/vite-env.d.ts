/// <reference types="vite/client" />

import type Phaser from 'phaser';

declare global {
  interface Window {
    /** Present only when the page is opened with `?debug`. Used by manual and automated tests. */
    __PIXELQUEST__?: {
      game: Phaser.Game;
    };
  }
}

export {};
