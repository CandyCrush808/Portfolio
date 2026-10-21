import type Phaser from 'phaser';
import { VIEW } from '../config/constants';
import { eventBus, GameEvents } from './EventBus';

export interface ViewportInfo {
  cssWidth: number;
  cssHeight: number;
  /** Device pixel ratio used for the calculation. */
  dpr: number;
  /** Integer device pixels per logical game pixel. */
  zoom: number;
  /** CSS pixels per logical pixel (zoom / dpr). */
  cssScale: number;
  logicalWidth: number;
  logicalHeight: number;
  orientation: 'portrait' | 'landscape';
}

/**
 * Pure viewport maths (no DOM, no Phaser) so it can be unit-tested later.
 *
 * 1. Work in physical device pixels.
 * 2. Largest integer zoom that still fits the minimum logical view.
 * 3. Cap the zoom at MAX_CSS_SCALE CSS pixels per logical pixel.
 * 4. Logical size fills the viewport at that zoom; leftover < 1 logical pixel.
 */
export function computeViewport(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): ViewportInfo {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  const physWidth = Math.max(1, Math.floor(cssWidth * dpr));
  const physHeight = Math.max(1, Math.floor(cssHeight * dpr));

  const zoomForArea = Math.floor(
    Math.min(physWidth / VIEW.MIN_LOGICAL_WIDTH, physHeight / VIEW.MIN_LOGICAL_HEIGHT),
  );
  const zoomCap = Math.max(1, Math.floor(VIEW.MAX_CSS_SCALE * dpr));
  const zoom = Math.max(1, Math.min(zoomForArea, zoomCap));

  return {
    cssWidth,
    cssHeight,
    dpr,
    zoom,
    cssScale: zoom / dpr,
    logicalWidth: Math.max(1, Math.floor(physWidth / zoom)),
    logicalHeight: Math.max(1, Math.floor(physHeight / zoom)),
    orientation: cssHeight >= cssWidth ? 'portrait' : 'landscape',
  };
}

function sameLayout(a: ViewportInfo, b: ViewportInfo): boolean {
  return (
    a.logicalWidth === b.logicalWidth &&
    a.logicalHeight === b.logicalHeight &&
    a.zoom === b.zoom &&
    a.dpr === b.dpr
  );
}

/**
 * Keeps the Phaser canvas pixel-perfect as the window resizes, the device
 * rotates, or browser zoom changes. It never stretches: it changes the logical
 * game size and the integer zoom together.
 */
export class ResponsiveScaler {
  private current: ViewportInfo | null = null;
  private frame = 0;
  private lateTimer = 0;
  private readonly disposers: Array<() => void> = [];

  constructor(
    private readonly game: Phaser.Game,
    private readonly container: HTMLElement,
  ) {}

  static measure(container: HTMLElement): ViewportInfo {
    const rect = container.getBoundingClientRect();
    return computeViewport(rect.width, rect.height, window.devicePixelRatio || 1);
  }

  /** `initial` must be the viewport the Game was created with. */
  start(initial: ViewportInfo): void {
    this.current = initial;
    eventBus.emit(GameEvents.VIEWPORT_CHANGED, initial);

    const schedule = (): void => this.schedule();
    // Rotation can report stale sizes; re-measure again after the browser settles.
    const onOrientation = (): void => {
      this.schedule();
      window.clearTimeout(this.lateTimer);
      this.lateTimer = window.setTimeout(schedule, 300);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(this.container);
    this.disposers.push(() => observer.disconnect());

    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', onOrientation);
    this.disposers.push(() => window.removeEventListener('resize', schedule));
    this.disposers.push(() => window.removeEventListener('orientationchange', onOrientation));

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', schedule);
      this.disposers.push(() => vv.removeEventListener('resize', schedule));
    }

    // Browser zoom / moving between monitors changes devicePixelRatio.
    const watchDpr = (): void => {
      const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      const onChange = (): void => {
        schedule();
        watchDpr();
      };
      mql.addEventListener('change', onChange, { once: true });
      this.disposers.push(() => mql.removeEventListener('change', onChange));
    };
    watchDpr();
  }

  stop(): void {
    window.cancelAnimationFrame(this.frame);
    window.clearTimeout(this.lateTimer);
    this.disposers.splice(0).forEach((dispose) => dispose());
  }

  private schedule(): void {
    if (this.frame) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = 0;
      this.apply();
    });
  }

  private apply(): void {
    const next = ResponsiveScaler.measure(this.container);
    if (this.current && sameLayout(this.current, next)) {
      this.current = next;
      return;
    }
    this.current = next;
    this.game.scale.setZoom(next.cssScale);
    this.game.scale.resize(next.logicalWidth, next.logicalHeight);
    eventBus.emit(GameEvents.VIEWPORT_CHANGED, next);
  }
}
