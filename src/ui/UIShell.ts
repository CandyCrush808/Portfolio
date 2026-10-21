import {
  type AssetReport,
  eventBus,
  type FatalErrorPayload,
  GameEvents,
  type ViewportInfo,
} from '../core/EventBus';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // textContent only: never inject strings as HTML.
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * DOM interface layer: loading screen, HUD, asset-check panel and error
 * screen. It talks to the game only through the event bus.
 */
export class UIShell {
  private readonly splash: HTMLElement | null;
  private readonly splashFill: HTMLElement | null;
  private readonly splashStatus: HTMLElement | null;
  private readonly splashBar: HTMLElement | null;

  private readonly hud: HTMLElement;
  private readonly readout: HTMLElement;
  private readonly assetButton: HTMLButtonElement;
  private readonly assetPanel: HTMLElement;
  private readonly assetList: HTMLElement;
  private readonly errorOverlay: HTMLElement;
  private readonly errorTitle: HTMLElement;
  private readonly errorMessage: HTMLElement;
  private readonly errorDetails: HTMLElement;

  private gameReady = false;

  constructor(private readonly root: HTMLElement) {
    this.splash = document.getElementById('boot-splash');
    this.splashFill = this.splash?.querySelector<HTMLElement>('.splash-bar-fill') ?? null;
    this.splashBar = this.splash?.querySelector<HTMLElement>('.splash-bar') ?? null;
    this.splashStatus = document.getElementById('splash-status');

    // ---- HUD (hidden until the game is ready) ----
    this.hud = el('div');
    this.hud.hidden = true;

    const top = el('div', 'pq-hud-top');
    const title = el('div', 'pq-chip');
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    title.append(
      el('strong', undefined, 'PixelQuest'),
      document.createTextNode(' · Phase 1 test scene'),
      document.createElement('br'),
      document.createTextNode(
        coarse ? 'Touch and hold to steer' : 'Move: WASD / arrows, or hold the mouse to steer',
      ),
    );

    this.assetButton = el('button', 'pq-button', 'Assets');
    this.assetButton.type = 'button';
    this.assetButton.setAttribute('aria-pressed', 'false');
    this.assetButton.setAttribute('aria-controls', 'asset-panel');
    this.assetButton.addEventListener('click', () => this.toggleAssetPanel());
    top.append(title, this.assetButton);

    const bottom = el('div', 'pq-hud-bottom');
    this.readout = el('div', 'pq-chip', '');
    this.readout.setAttribute('aria-label', 'Viewport information');
    bottom.append(this.readout);

    this.assetPanel = el('section', 'pq-panel');
    this.assetPanel.id = 'asset-panel';
    this.assetPanel.hidden = true;
    this.assetPanel.tabIndex = -1;
    this.assetPanel.setAttribute('aria-label', 'Loaded assets');
    const panelTitle = el('h2', undefined, 'Asset check');
    this.assetList = el('ul');
    const close = el('button', 'pq-button', 'Close');
    close.type = 'button';
    close.addEventListener('click', () => this.toggleAssetPanel(false));
    this.assetPanel.append(panelTitle, this.assetList, close);

    this.hud.append(top, bottom, this.assetPanel);

    // ---- Error overlay ----
    this.errorOverlay = el('div', 'pq-error');
    this.errorOverlay.hidden = true;
    this.errorOverlay.setAttribute('role', 'alert');
    const card = el('div', 'pq-error-card');
    this.errorTitle = el('h2');
    this.errorMessage = el('p');
    this.errorDetails = el('ul');
    const reload = el('button', 'pq-button', 'Reload');
    reload.type = 'button';
    reload.addEventListener('click', () => window.location.reload());
    card.append(this.errorTitle, this.errorMessage, this.errorDetails, reload);
    this.errorOverlay.append(card);

    this.root.append(this.hud, this.errorOverlay);

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.assetPanel.hidden) this.toggleAssetPanel(false);
    });
  }

  bind(): void {
    eventBus.on(GameEvents.LOAD_PROGRESS, this.onProgress, this);
    eventBus.on(GameEvents.ASSETS_REPORT, this.onAssetsReport, this);
    eventBus.on(GameEvents.GAME_READY, this.onGameReady, this);
    eventBus.on(GameEvents.VIEWPORT_CHANGED, this.onViewport, this);
    eventBus.on(GameEvents.FATAL_ERROR, this.showFatalError, this);
  }

  get isGameReady(): boolean {
    return this.gameReady;
  }

  showFatalError(payload: FatalErrorPayload): void {
    this.hideSplash(true);
    this.errorTitle.textContent = payload.title;
    this.errorMessage.textContent = payload.message;
    this.errorDetails.replaceChildren(
      ...(payload.details ?? []).map((line) => el('li', undefined, line)),
    );
    this.errorOverlay.hidden = false;
  }

  private onProgress(value: number): void {
    const percent = Math.round(value * 100);
    if (this.splashFill) this.splashFill.style.width = `${percent}%`;
    this.splashBar?.setAttribute('aria-valuenow', String(percent));
    if (this.splashStatus) this.splashStatus.textContent = `Loading… ${percent}%`;
  }

  private onAssetsReport(report: AssetReport): void {
    const items = report.entries.map((entry) => {
      const li = el('li');
      const label =
        entry.status === 'ok'
          ? 'loaded, size verified'
          : entry.status === 'size-mismatch'
            ? 'SIZE MISMATCH'
            : 'FAILED TO LOAD';
      const statusClass =
        entry.status === 'ok'
          ? 'pq-status-ok'
          : entry.status === 'size-mismatch'
            ? 'pq-status-warn'
            : 'pq-status-fail';
      const size =
        entry.actualWidth === null
          ? 'n/a'
          : `${entry.actualWidth}×${entry.actualHeight}`;
      li.append(
        el('strong', undefined, entry.key),
        document.createTextNode(` — ${entry.path} — ${size} `),
        el('span', statusClass, `(${label})`),
        document.createElement('br'),
        document.createTextNode(entry.note),
      );
      return li;
    });
    this.assetList.replaceChildren(...items);
  }

  private onGameReady(): void {
    this.gameReady = true;
    this.hud.hidden = false;
    this.hideSplash(false);
  }

  private onViewport(vp: ViewportInfo): void {
    this.readout.textContent =
      `view ${vp.logicalWidth}×${vp.logicalHeight} · zoom ×${vp.zoom} · dpr ${vp.dpr} · ${vp.orientation}`;
  }

  private hideSplash(immediately: boolean): void {
    if (!this.splash) return;
    const splash = this.splash;
    splash.classList.add('is-hidden');
    if (immediately) {
      splash.hidden = true;
    } else {
      // Remove from the accessibility tree once the fade finishes.
      window.setTimeout(() => (splash.hidden = true), 400);
    }
  }

  private toggleAssetPanel(force?: boolean): void {
    const open = force ?? this.assetPanel.hidden;
    this.assetPanel.hidden = !open;
    this.assetButton.setAttribute('aria-pressed', String(open));
    if (open) this.assetPanel.focus();
    else this.assetButton.focus();
  }
}
