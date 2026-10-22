import {
  type AssetReport,
  eventBus,
  type FatalErrorPayload,
  GameEvents,
  type ViewportInfo,
} from '../core/EventBus';
import {
  DEVELOPER_PROFILE,
  PROJECTS,
  SKILL_CATEGORIES,
  QUEST_OBJECTIVES,
  type QuestObjective,
  EXPERIENCE_DATA,
  SERVICES_DATA,
  type ExperienceItem,
  type ServiceItem,
} from '../data/portfolioData';
import { soundEffects } from '../audio/SoundEffects';
import { VILLAGE } from '../world/maps/villageMap';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

interface DialogueLine {
  speaker: string;
  title?: string;
  avatarKey?: string;
  text: string;
}

/**
 * Complete polished DOM interface layer:
 * - Boot loading & welcome title screen
 * - Top & bottom in-game HUD (Identity, Location, Controls, Objectives, Contextual Prompt)
 * - Retro RPG typewriter dialogue window
 * - Full-featured portfolio modals (Projects, Skills, About, Contact, Help, Pause)
 * - Toast notification banner
 */
export class UIShell {
  private readonly splash: HTMLElement | null;
  private readonly splashFill: HTMLElement | null;
  private readonly splashStatus: HTMLElement | null;
  private readonly splashBar: HTMLElement | null;

  // Title / Welcome Screen
  private readonly welcomeScreen: HTMLElement;

  // In-Game HUD Elements
  private readonly hud: HTMLElement;
  private readonly minimapCanvas: HTMLCanvasElement;
  private minimapPlayer = { x: VILLAGE.spawn.x, y: VILLAGE.spawn.y };
  private readonly identityPanel: HTMLElement;
  private readonly locationBadge: HTMLElement;
  private readonly controlsBar: HTMLElement;
  private readonly soundBtn: HTMLButtonElement;
  private readonly helpBtn: HTMLButtonElement;
  private readonly pauseBtn: HTMLButtonElement;
  private readonly fsBtn: HTMLButtonElement;
  private readonly assetBtn: HTMLButtonElement;

  private readonly questPanel: HTMLElement;
  private readonly questList: HTMLElement;
  private readonly questToggleBtn: HTMLButtonElement;

  private readonly interactPrompt: HTMLElement;
  private readonly interactText: HTMLElement;
  private readonly interactKey: HTMLElement;

  // Modal Overlay & Containers
  private readonly modalBackdrop: HTMLElement;
  private readonly modalContainer: HTMLElement;
  private activeModalId: string | null = null;

  // Dialogue Overlay
  private readonly dialogueBox: HTMLElement;
  private readonly dialogueSpeaker: HTMLElement;
  private readonly dialogueTitle: HTMLElement;
  private readonly dialogueText: HTMLElement;
  private readonly dialogueContinue: HTMLButtonElement;
  private dialogueQueue: DialogueLine[] = [];
  private currentDialogueIndex = 0;
  private typewriterTimer = 0;
  private isTypingDialogue = false;

  // Toast Notifications
  private readonly toastContainer: HTMLElement;

  // Asset Inspection (preserved from initial audit)
  private readonly assetPanel: HTMLElement;
  private readonly assetList: HTMLElement;

  // Error overlay
  private readonly errorOverlay: HTMLElement;
  private readonly errorTitle: HTMLElement;
  private readonly errorMessage: HTMLElement;
  private readonly errorDetails: HTMLElement;

  // State
  private gameReady = false;
  private adventureStarted = false;
  private objectives: QuestObjective[] = JSON.parse(JSON.stringify(QUEST_OBJECTIVES));
  private loadingMessages = [
    'Preparing your adventure…',
    'Assembling 16-bit village paths…',
    'Tuning retro synthesizers…',
    'Lighting village lanterns…',
    'Ready to explore!',
  ];
  private currentLoadingMsgIndex = 0;
  private loadingMsgInterval = 0;

  constructor(private readonly root: HTMLElement) {
    this.splash = document.getElementById('boot-splash');
    this.splashFill = this.splash?.querySelector<HTMLElement>('.splash-bar-fill') ?? null;
    this.splashBar = this.splash?.querySelector<HTMLElement>('.splash-bar') ?? null;
    this.splashStatus = document.getElementById('splash-status');

    this.startLoadingMessageCycle();

    // 1. Toast Notification Container
    this.toastContainer = el('div', 'pq-toast-container');

    // 2. Welcome / Title Screen
    this.welcomeScreen = this.buildWelcomeScreen();

    // 3. In-Game HUD
    this.hud = el('div', 'pq-hud');
    this.hud.hidden = true;

    // Top-Left: Identity
    this.identityPanel = el('div', 'pq-identity');
    const avatar = el('div', 'pq-avatar');
    avatar.setAttribute('aria-hidden', 'true');
    const avatarInner = el('span', 'pq-avatar-img', '🧙‍♂️');
    avatar.appendChild(avatarInner);

    const statsPanel = el('div', 'pq-player-stats');
    const healthRow = el('div', 'pq-stat-row');
    healthRow.append(el('span', 'pq-stat-icon', '♥'));
    const healthTrack = el('div', 'pq-stat-track pq-health-track');
    const healthFill = el('span', 'pq-stat-fill pq-health-fill');
    healthTrack.append(healthFill);
    healthRow.append(healthTrack);
    const energyRow = el('div', 'pq-stat-row');
    energyRow.append(el('span', 'pq-stat-icon', 'ϟ'));
    const energyTrack = el('div', 'pq-stat-track pq-energy-track');
    const energyFill = el('span', 'pq-stat-fill pq-energy-fill');
    energyTrack.append(energyFill);
    energyRow.append(energyTrack);
    statsPanel.append(healthRow, energyRow);

    const identityText = el('div', 'pq-identity-text');
    const nameLine = el('div', 'pq-identity-name', DEVELOPER_PROFILE.name);
    const roleLine = el('div', 'pq-identity-role', DEVELOPER_PROFILE.role);
    const statusLine = el('div', 'pq-identity-status');
    const statusDot = el('span', 'pq-status-dot');
    const statusLabel = el('span', undefined, 'Online • Exploring');
    statusLine.append(statusDot, statusLabel);
    identityText.append(nameLine, roleLine, statusLine);

    this.identityPanel.append(avatar, identityText, statsPanel);
    this.identityPanel.title = 'Click to view About Cottage';
    this.identityPanel.addEventListener('click', () => this.openModal('about'));

    // Top-Center: Location Badge
    this.locationBadge = el('div', 'pq-location-badge');
    const locIcon = el('span', 'pq-loc-icon', '🧭');
    const locText = el('span', 'pq-loc-text', 'MAIN PLAZA');
    this.locationBadge.append(locIcon, locText);

    // Top-Right: Game Controls
    this.controlsBar = el('div', 'pq-controls-bar');
    this.soundBtn = el('button', 'pq-hud-btn', soundEffects.isMuted ? '🔇' : '🔊');
    this.soundBtn.type = 'button';
    this.soundBtn.title = 'Toggle Sound (M)';
    this.soundBtn.setAttribute('aria-label', 'Toggle Sound');
    this.soundBtn.addEventListener('click', () => this.toggleSound());

    this.helpBtn = el('button', 'pq-hud-btn', '❓');
    this.helpBtn.type = 'button';
    this.helpBtn.title = 'How to Play / Controls';
    this.helpBtn.setAttribute('aria-label', 'How to Play');
    this.helpBtn.addEventListener('click', () => this.openModal('help'));

    this.pauseBtn = el('button', 'pq-hud-btn', '⏸');
    this.pauseBtn.type = 'button';
    this.pauseBtn.title = 'Pause Menu (Esc)';
    this.pauseBtn.setAttribute('aria-label', 'Pause Menu');
    this.pauseBtn.addEventListener('click', () => this.openModal('pause'));

    this.fsBtn = el('button', 'pq-hud-btn', '⛶');
    this.fsBtn.type = 'button';
    this.fsBtn.title = 'Toggle Fullscreen';
    this.fsBtn.setAttribute('aria-label', 'Toggle Fullscreen');
    this.fsBtn.addEventListener('click', () => { void this.toggleFullscreen(); });
    document.addEventListener('fullscreenchange', () => this.syncFullscreenButton());

    this.assetBtn = el('button', 'pq-hud-btn', '📦');
    this.assetBtn.type = 'button';
    this.assetBtn.title = 'Audit Assets';
    this.assetBtn.setAttribute('aria-label', 'Audit Assets');
    this.assetBtn.addEventListener('click', () => this.toggleAssetPanel());

    this.controlsBar.append(this.soundBtn, this.helpBtn, this.pauseBtn, this.fsBtn, this.assetBtn);

    const hudTop = el('div', 'pq-hud-top');
    hudTop.append(this.identityPanel, this.locationBadge, this.controlsBar);

    // Bottom-Left: Quest / Objectives Panel
    this.questPanel = el('div', 'pq-quest-panel');
    const questHeader = el('div', 'pq-quest-header');
    const questTitle = el('div', 'pq-quest-title', '📜 QUEST LOG');
    this.questToggleBtn = el('button', 'pq-quest-toggle', '−');
    this.questToggleBtn.type = 'button';
    this.questToggleBtn.setAttribute('aria-label', 'Toggle Quest Log');
    this.questToggleBtn.addEventListener('click', () => this.toggleQuestPanel());
    questHeader.append(questTitle, this.questToggleBtn);

    this.questList = el('ul', 'pq-quest-list');
    this.renderObjectives();
    this.questPanel.append(questHeader, this.questList);

    // Bottom-Center: Contextual Interaction Prompt
    this.interactPrompt = el('div', 'pq-interact-prompt');
    this.interactPrompt.hidden = true;
    const promptBadge = el('div', 'pq-prompt-inner');
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    this.interactKey = el('kbd', 'pq-prompt-key', isTouch ? 'TAP' : 'E');
    this.interactText = el('span', 'pq-prompt-text', 'Interact');
    promptBadge.append(this.interactKey, this.interactText);
    this.interactPrompt.append(promptBadge);
    this.interactPrompt.addEventListener('click', () => {
      soundEffects.playInteract();
      eventBus.emit(GameEvents.INTERACT_ACTION);
    });

    const hudBottom = el('div', 'pq-hud-bottom');
    hudBottom.append(this.questPanel, this.interactPrompt);

    this.hud.append(hudTop, hudBottom);

    // Top-right minimap: a compact overview of the complete village.
    const minimap = el('div', 'pq-minimap');
    const compass = el('span', 'pq-minimap-compass', 'N');
    this.minimapCanvas = el('canvas', 'pq-minimap-canvas');
    this.minimapCanvas.width = 320;
    this.minimapCanvas.height = 224;
    this.minimapCanvas.setAttribute('aria-label', 'Village minimap showing player position');
    minimap.append(compass, this.minimapCanvas);
    this.hud.append(minimap);
    this.drawMinimap();

    // 4. Dialogue Box
    this.dialogueBox = el('div', 'pq-dialogue');
    this.dialogueBox.hidden = true;
    const dCard = el('div', 'pq-dialogue-card');

    const dHeader = el('div', 'pq-dialogue-header');
    const dPortrait = el('div', 'pq-dialogue-portrait', '🧙‍♂️');
    const dSpeakerInfo = el('div', 'pq-dialogue-info');
    this.dialogueSpeaker = el('div', 'pq-dialogue-name', 'Rowan');
    this.dialogueTitle = el('div', 'pq-dialogue-title', 'Village Guide');
    dSpeakerInfo.append(this.dialogueSpeaker, this.dialogueTitle);
    const dClose = el('button', 'pq-dialogue-close', '✕');
    dClose.type = 'button';
    dClose.setAttribute('aria-label', 'Close Dialogue');
    dClose.addEventListener('click', () => this.closeDialogue());
    dHeader.append(dPortrait, dSpeakerInfo, dClose);

    this.dialogueText = el('div', 'pq-dialogue-text');
    const dFooter = el('div', 'pq-dialogue-footer');
    this.dialogueContinue = el('button', 'pq-btn pq-btn-gold', 'Continue ▶');
    this.dialogueContinue.type = 'button';
    this.dialogueContinue.addEventListener('click', () => this.advanceDialogue());
    dFooter.append(this.dialogueContinue);

    dCard.append(dHeader, this.dialogueText, dFooter);
    this.dialogueBox.append(dCard);
    // Clicking card advances dialogue or skips typewriter
    dCard.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        this.advanceDialogue();
      }
    });

    // 5. Modal Backdrop & Container
    this.modalBackdrop = el('div', 'pq-modal-backdrop');
    this.modalBackdrop.hidden = true;
    this.modalContainer = el('div', 'pq-modal-container');
    this.modalBackdrop.append(this.modalContainer);
    this.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.modalBackdrop) {
        this.closeModal();
      }
    });

    // 6. Asset Panel (audited asset viewer)
    this.assetPanel = el('section', 'pq-panel');
    this.assetPanel.id = 'asset-panel';
    this.assetPanel.hidden = true;
    this.assetPanel.tabIndex = -1;
    this.assetPanel.setAttribute('aria-label', 'Loaded assets');
    const panelTitle = el('h2', undefined, 'Asset Audit Report');
    this.assetList = el('ul');
    const closeAssetBtn = el('button', 'pq-btn', 'Close');
    closeAssetBtn.type = 'button';
    closeAssetBtn.addEventListener('click', () => this.toggleAssetPanel(false));
    this.assetPanel.append(panelTitle, this.assetList, closeAssetBtn);

    // 7. Error Overlay
    this.errorOverlay = el('div', 'pq-error');
    this.errorOverlay.hidden = true;
    this.errorOverlay.setAttribute('role', 'alert');
    const errorCard = el('div', 'pq-error-card');
    this.errorTitle = el('h2');
    this.errorMessage = el('p');
    this.errorDetails = el('ul');
    const reload = el('button', 'pq-btn', 'Reload');
    reload.type = 'button';
    reload.addEventListener('click', () => window.location.reload());
    errorCard.append(this.errorTitle, this.errorMessage, this.errorDetails, reload);
    this.errorOverlay.append(errorCard);

    // Append everything to root
    this.root.append(
      this.welcomeScreen,
      this.hud,
      this.dialogueBox,
      this.modalBackdrop,
      this.assetPanel,
      this.toastContainer,
      this.errorOverlay,
    );

    // Capture UI shortcuts before Phaser handles them, avoiding duplicate actions.
    window.addEventListener('keydown', (event) => {
      const active = document.activeElement;
      const isTyping = active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable);
      if (isTyping) return;

      if (!this.dialogueBox.hidden && (event.key === 'e' || event.key === 'E' || event.key === ' ' || event.code === 'Space')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.advanceDialogue();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!this.dialogueBox.hidden) {
          this.closeDialogue();
        } else if (this.activeModalId) {
          this.closeModal();
        } else if (!this.assetPanel.hidden) {
          this.toggleAssetPanel(false);
        } else if (this.gameReady && this.adventureStarted) {
          this.openModal('pause');
        }
      } else if (event.key === 'm' || event.key === 'M') {
        event.preventDefault();
        this.toggleSound();
      }
    }, true);
  }

  bind(): void {
    eventBus.on(GameEvents.LOAD_PROGRESS, this.onProgress, this);
    eventBus.on(GameEvents.ASSETS_REPORT, this.onAssetsReport, this);
    eventBus.on(GameEvents.GAME_READY, this.onGameReady, this);
    eventBus.on(GameEvents.VIEWPORT_CHANGED, this.onViewport, this);
    eventBus.on(GameEvents.FATAL_ERROR, this.showFatalError, this);
    eventBus.on(GameEvents.ZONE_CHANGED, this.onZoneChanged, this);
    eventBus.on(GameEvents.PLAYER_POSITION, this.onPlayerPosition, this);
    eventBus.on(GameEvents.INTERACTION_HINT, this.onInteractionHint, this);
    eventBus.on(GameEvents.START_DIALOGUE, this.onStartDialogue, this);
    eventBus.on(GameEvents.OPEN_MODAL, this.onOpenModalEvent, this);
    eventBus.on(GameEvents.INTERACT_ACTION, this.onInteractAction, this);
    eventBus.on(GameEvents.OBJECTIVE_COMPLETED, this.onObjectiveCompleted, this);
  }

  get isGameReady(): boolean {
    return this.gameReady;
  }

  // ---------------------------------------------------------------------------
  // Welcome / Title Screen
  // ---------------------------------------------------------------------------
  private buildWelcomeScreen(): HTMLElement {
    const screen = el('div', 'pq-welcome-screen');
    screen.hidden = true;

    const card = el('div', 'pq-welcome-card');

    const badge = el('div', 'pq-welcome-badge', '★ RETRO RPG PORTFOLIO ★');
    const title = el('h1', 'pq-welcome-title', 'PixelQuest');
    const subtitle = el('p', 'pq-welcome-subtitle', 'An Interactive Portfolio Adventure');

    const descBox = el('div', 'pq-welcome-desc');
    descBox.append(
      el('p', undefined, 'Step into an explorable 16-bit village crafted with Phaser 3, TypeScript, and modern web UI.'),
      el('p', 'pq-welcome-instruction', 'Explore the world • Meet the characters • Discover the work'),
    );

    const controlsTip = el('div', 'pq-welcome-controls');
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    controlsTip.textContent = isTouch
      ? '📱 Touch D-pad to move, tap Action button or doors to interact'
      : '⌨ Move with WASD or Arrows • Press E or Space to interact';

    const btnRow = el('div', 'pq-welcome-actions');
    const startBtn = el('button', 'pq-btn pq-btn-gold pq-btn-large', 'START ADVENTURE ▶');
    startBtn.type = 'button';
    startBtn.addEventListener('click', () => this.startAdventure());

    const howBtn = el('button', 'pq-btn pq-btn-secondary', 'HOW TO PLAY');
    howBtn.type = 'button';
    howBtn.addEventListener('click', () => this.openModal('help'));

    btnRow.append(startBtn, howBtn);

    const metaRow = el('div', 'pq-welcome-meta');
    const authorSpan = el('span', undefined, `Created by ${DEVELOPER_PROFILE.name}`);
    const soundToggle = el('button', 'pq-welcome-sound-toggle', soundEffects.isMuted ? '🔇 Sound: Off' : '🔊 Sound: On');
    soundToggle.type = 'button';
    soundToggle.addEventListener('click', () => {
      this.toggleSound();
      soundToggle.textContent = soundEffects.isMuted ? '🔇 Sound: Off' : '🔊 Sound: On';
    });
    metaRow.append(authorSpan, soundToggle);

    card.append(badge, title, subtitle, descBox, controlsTip, btnRow, metaRow);
    screen.append(card);
    return screen;
  }

  private startAdventure(): void {
    soundEffects.playStart();
    this.adventureStarted = true;
    this.welcomeScreen.classList.add('is-hidden');
    window.setTimeout(() => {
      this.welcomeScreen.hidden = true;
    }, 350);

    this.hud.hidden = false;
    this.showToast('⚔ Welcome to Pixel Town! Explore the village square.');
    eventBus.emit(GameEvents.CLOSE_MODAL);
  }

  // ---------------------------------------------------------------------------
  // Loading & Boot
  // ---------------------------------------------------------------------------
  private startLoadingMessageCycle(): void {
    this.loadingMsgInterval = window.setInterval(() => {
      this.currentLoadingMsgIndex = (this.currentLoadingMsgIndex + 1) % this.loadingMessages.length;
      if (this.splashStatus) {
        this.splashStatus.textContent = this.loadingMessages[this.currentLoadingMsgIndex]!;
      }
    }, 1200);
  }

  private onProgress(value: number): void {
    const percent = Math.min(100, Math.round(value * 100));
    if (this.splashFill) this.splashFill.style.width = `${percent}%`;
    this.splashBar?.setAttribute('aria-valuenow', String(percent));
    if (this.splashStatus) {
      this.splashStatus.textContent = `Loading assets… ${percent}%`;
    }
  }

  private onGameReady(): void {
    window.clearInterval(this.loadingMsgInterval);
    this.gameReady = true;
    this.hideSplash(false);

    // Show welcome title screen on first boot
    this.welcomeScreen.hidden = false;
  }

  private hideSplash(immediately: boolean): void {
    if (!this.splash) return;
    const splash = this.splash;
    splash.classList.add('is-hidden');
    if (immediately) {
      splash.hidden = true;
    } else {
      window.setTimeout(() => {
        splash.hidden = true;
      }, 400);
    }
  }

  // ---------------------------------------------------------------------------
  // In-Game HUD Updates
  // ---------------------------------------------------------------------------
  private onPlayerPosition(payload: { x: number; y: number }): void {
    this.minimapPlayer = payload;
    this.drawMinimap();
  }

  private drawMinimap(): void {
    const ctx = this.minimapCanvas.getContext('2d');
    if (!ctx) return;
    const canvas = this.minimapCanvas;
    const sx = canvas.width / VILLAGE.width;
    const sy = canvas.height / VILLAGE.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Lush Green Land Base
    ctx.fillStyle = '#539644';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Perimeter Forest Borders
    ctx.fillStyle = '#265428';
    ctx.fillRect(0, 0, canvas.width, 16);
    ctx.fillRect(0, 0, 16, canvas.height);
    ctx.fillRect(canvas.width - 16, 0, 16, canvas.height);
    ctx.fillRect(0, canvas.height - 14, 150, 14);
    ctx.fillRect(170, canvas.height - 14, canvas.width - 170, 14);

    // 3. Southwest Tranquil Pond
    ctx.fillStyle = '#1e8891';
    ctx.beginPath();
    ctx.ellipse(950 * sx, 2300 * sy, 340 * sx, 220 * sy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2cb8aa';
    ctx.beginPath();
    ctx.ellipse(950 * sx, 2300 * sy, 290 * sx, 180 * sy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Eastern River flowing smoothly down the map
    ctx.fillStyle = '#1e8891';
    ctx.beginPath();
    ctx.moveTo(3360 * sx, 0);
    ctx.lineTo(3600 * sx, 0);
    ctx.lineTo(3580 * sx, 600 * sy);
    ctx.lineTo(3520 * sx, 1200 * sy);
    ctx.lineTo(3480 * sx, 1800 * sy);
    ctx.lineTo(3440 * sx, 2400 * sy);
    ctx.lineTo(3560 * sx, canvas.height);
    ctx.lineTo(3320 * sx, canvas.height);
    ctx.lineTo(3220 * sx, 2400 * sy);
    ctx.lineTo(3260 * sx, 1800 * sy);
    ctx.lineTo(3300 * sx, 1200 * sy);
    ctx.lineTo(3360 * sx, 600 * sy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2cb8aa';
    ctx.beginPath();
    ctx.moveTo(3390 * sx, 0);
    ctx.lineTo(3570 * sx, 0);
    ctx.lineTo(3540 * sx, 600 * sy);
    ctx.lineTo(3480 * sx, 1200 * sy);
    ctx.lineTo(3440 * sx, 1800 * sy);
    ctx.lineTo(3400 * sx, 2400 * sy);
    ctx.lineTo(3520 * sx, canvas.height);
    ctx.lineTo(3360 * sx, canvas.height);
    ctx.lineTo(3260 * sx, 2400 * sy);
    ctx.lineTo(3300 * sx, 1800 * sy);
    ctx.lineTo(3340 * sx, 1200 * sy);
    ctx.lineTo(3400 * sx, 600 * sy);
    ctx.closePath();
    ctx.fill();

    // 5. River Bridges & Fishing Dock
    ctx.fillStyle = '#87552e';
    ctx.fillRect(3370 * sx, 480 * sy, 160 * sx, 40 * sy);
    ctx.fillRect(3220 * sx, 1360 * sy, 160 * sx, 40 * sy);
    ctx.fillRect(3230 * sx, 2370 * sy, 40 * sx, 160 * sy);
    ctx.fillRect(975 * sx, 2180 * sy, 50 * sx, 80 * sy);

    // 6. Connected Golden Dirt Paths
    ctx.strokeStyle = '#947750';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const path of VILLAGE.paths) {
      ctx.beginPath();
      path.forEach((point, index) => {
        const x = point.x * sx;
        const y = point.y * sy;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    ctx.strokeStyle = '#d9be8e';
    ctx.lineWidth = 7;
    for (const path of VILLAGE.paths) {
      ctx.beginPath();
      path.forEach((point, index) => {
        const x = point.x * sx;
        const y = point.y * sy;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Plaza Circle & Fountain
    ctx.fillStyle = '#94826d';
    ctx.beginPath();
    ctx.arc(2048 * sx, 1440 * sy, 220 * sx, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d9be8e';
    ctx.beginPath();
    ctx.arc(2048 * sx, 1440 * sy, 204 * sx, 0, Math.PI * 2);
    ctx.fill();

    // Central Fountain on minimap
    ctx.fillStyle = '#2cb8aa';
    ctx.beginPath();
    ctx.arc(2048 * sx, 1440 * sy, 55 * sx, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ded4c3';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 7. All 8 Buildings Color-Coded by Architectural Silhouette
    const roofColors: Record<string, string> = {
      about: '#b54737',
      projects: '#3b526f',
      skills: '#2b5796',
      experience: '#a8362b',
      services: '#2b5796',
      contact: '#365476',
      house1: '#a36433',
      house2: '#a36433',
    };

    for (const building of VILLAGE.buildings) {
      const bx = building.x * sx;
      const by = building.y * sy;
      const bw = building.width * sx;
      const bh = building.height * sy;
      const roofCol = roofColors[building.id] ?? '#75462f';

      // Building footprint
      ctx.fillStyle = '#4a3325';
      ctx.fillRect(bx, by, bw, bh);

      // Roof color
      ctx.fillStyle = roofCol;
      ctx.fillRect(bx + 2, by + 2, Math.max(4, bw - 4), Math.max(4, bh * 0.7));

      // Services Market striped awning
      if (building.id === 'services') {
        ctx.fillStyle = '#d93a3a';
        ctx.fillRect(bx + 4, by + bh * 0.55, Math.max(4, bw - 8), Math.max(2, bh * 0.18));
      }

      // Entrance door
      ctx.fillStyle = '#f5ebd2';
      ctx.fillRect(bx + bw * 0.42, by + bh * 0.75, Math.max(3, bw * 0.16), Math.max(4, bh * 0.22));
    }

    // 8. Player Marker with pulsing golden ring
    const px = this.minimapPlayer.x * sx;
    const py = this.minimapPlayer.y * sy;

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.stroke();
  }

    for (const building of VILLAGE.buildings) {
      ctx.fillStyle = '#75462f';
      ctx.fillRect(building.x * sx, building.y * sy, building.width * sx, building.height * sy);
      ctx.fillStyle = '#e6ad62';
      ctx.fillRect((building.x + 8) * sx, (building.y + 8) * sy, Math.max(4, (building.width - 16) * sx), Math.max(4, (building.height - 16) * sy));
      ctx.fillStyle = '#315b43';
      ctx.fillRect((building.x + building.width * 0.42) * sx, (building.y + building.height * 0.68) * sy, Math.max(4, building.width * 0.16 * sx), Math.max(4, building.height * 0.24 * sy));
    }

    for (const prop of VILLAGE.props) {
      if (prop.texture !== 'tree') continue;
      ctx.fillStyle = '#276345';
      ctx.beginPath();
      ctx.arc(prop.x * sx, prop.y * sy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#55a94e';
      ctx.beginPath();
      ctx.arc(prop.x * sx - 2, prop.y * sy - 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player marker stays visible over the map.
    ctx.fillStyle = '#fff4c7';
    ctx.beginPath();
    ctx.arc(this.minimapPlayer.x * sx, this.minimapPlayer.y * sy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ed4e59';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.minimapPlayer.x * sx, this.minimapPlayer.y * sy, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  private onZoneChanged(payload: { zoneId: string; label: string }): void {
    const locText = this.locationBadge.querySelector<HTMLElement>('.pq-loc-text');
    const locIcon = this.locationBadge.querySelector<HTMLElement>('.pq-loc-icon');
    if (locText) {
      locText.textContent = payload.label;
    }
    if (locIcon) {
      const icons: Record<string, string> = {
        spawn: '🚪',
        portfolio: '⚒',
        projects: '⚒',
        skills: '⚔',
        about: '📜',
        experience: '🛡',
        services: '⚖',
        contact: '✉',
        pond: '🎣',
        plaza: '⛲',
        river: '🌊',
      };
      locIcon.textContent = icons[payload.zoneId] ?? '🌲';
    }

    // Gentle pulse animation on location badge
    this.locationBadge.classList.remove('is-pulsing');
    void this.locationBadge.offsetWidth; // trigger reflow
    this.locationBadge.classList.add('is-pulsing');
  }

  private onInteractionHint(payload: { text: string | null; key: string } | null): void {
    if (payload && payload.text) {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      this.interactKey.textContent = isTouch ? 'TAP' : 'E';
      this.interactText.textContent = payload.text;
      this.interactPrompt.hidden = false;
    } else {
      this.interactPrompt.hidden = true;
    }
  }

  private toggleQuestPanel(): void {
    soundEffects.playInteract();
    const isCollapsed = this.questList.classList.toggle('is-collapsed');
    this.questToggleBtn.textContent = isCollapsed ? '+' : '−';
  }

  private renderObjectives(): void {
    this.questList.replaceChildren(
      ...this.objectives.map((obj) => {
        const li = el('li', `pq-quest-item ${obj.completed ? 'is-completed' : ''}`);
        const check = el('span', 'pq-quest-check', obj.completed ? '✓' : '○');
        const textSpan = el('span', 'pq-quest-name', obj.title);
        li.append(check, textSpan);
        li.title = obj.description;
        return li;
      }),
    );
  }

  private onObjectiveCompleted(payload: { id: string; title: string }): void {
    const target = this.objectives.find((o) => o.id === payload.id);
    if (target && !target.completed) {
      target.completed = true;
      this.renderObjectives();
      soundEffects.playSuccess();
      this.showToast(`✦ Quest Completed: ${target.title}!`);
    }
  }

  // ---------------------------------------------------------------------------
  // Dialogue System
  // ---------------------------------------------------------------------------
  private onInteractAction(): void {
    // While dialogue is active, the same action button/key advances dialogue;
    // WorldScene ignores ordinary interactions while the player is frozen.
    if (!this.dialogueBox.hidden) this.advanceDialogue();
  }

  private onStartDialogue(payload: { lines: DialogueLine[] }): void {
    if (!payload.lines || payload.lines.length === 0) return;
    this.dialogueQueue = payload.lines;
    this.currentDialogueIndex = 0;
    this.hud.classList.add('has-dialogue');
    this.dialogueBox.hidden = false;
    this.showDialogueLine(this.dialogueQueue[0]!);
  }

  private showDialogueLine(line: DialogueLine): void {
    this.dialogueSpeaker.textContent = line.speaker;
    this.dialogueTitle.textContent = line.title ?? '';
    this.dialogueText.textContent = '';
    this.isTypingDialogue = true;

    window.clearInterval(this.typewriterTimer);
    let charIdx = 0;
    const fullText = line.text;

    this.typewriterTimer = window.setInterval(() => {
      if (charIdx < fullText.length) {
        this.dialogueText.textContent += fullText[charIdx];
        if (charIdx % 3 === 0) {
          soundEffects.playDialogueBlip();
        }
        charIdx++;
      } else {
        window.clearInterval(this.typewriterTimer);
        this.isTypingDialogue = false;
      }
    }, 22);

    const isLast = this.currentDialogueIndex >= this.dialogueQueue.length - 1;
    this.dialogueContinue.textContent = isLast ? 'Done ✕' : 'Continue ▶';
  }

  private advanceDialogue(): void {
    if (this.isTypingDialogue) {
      // Instant reveal
      window.clearInterval(this.typewriterTimer);
      const currentLine = this.dialogueQueue[this.currentDialogueIndex];
      if (currentLine) {
        this.dialogueText.textContent = currentLine.text;
      }
      this.isTypingDialogue = false;
      return;
    }

    this.currentDialogueIndex++;
    if (this.currentDialogueIndex < this.dialogueQueue.length) {
      soundEffects.playInteract();
      this.showDialogueLine(this.dialogueQueue[this.currentDialogueIndex]!);
    } else {
      this.closeDialogue();
    }
  }

  private closeDialogue(): void {
    window.clearInterval(this.typewriterTimer);
    this.dialogueBox.hidden = true;
    this.hud.classList.remove('has-dialogue');
    this.isTypingDialogue = false;
    soundEffects.playClose();
    eventBus.emit(GameEvents.DIALOGUE_CLOSED);
  }

  // ---------------------------------------------------------------------------
  // Modals (Portfolio, Skills, About, Contact, Help, Pause)
  // ---------------------------------------------------------------------------
  private onOpenModalEvent(payload: { id: string; projectId?: string }): void {
    if (payload.id === 'pause-toggle') {
      if (this.activeModalId === 'pause') {
        this.closeModal();
      } else {
        this.openModal('pause');
      }
      return;
    }
    this.openModal(payload.id, payload.projectId);
  }

  openModal(id: string, extraParam?: string): void {
    eventBus.emit(GameEvents.PAUSE_GAME, { paused: true });
    soundEffects.playOpen();
    this.activeModalId = id;
    this.modalContainer.replaceChildren();

    switch (id) {
      case 'portfolio':
        this.renderPortfolioModal();
        break;
      case 'project-detail':
        this.renderProjectDetailModal(extraParam);
        break;
      case 'skills':
        this.renderSkillsModal();
        break;
      case 'about':
        this.renderAboutModal();
        break;
      case 'experience':
        this.renderExperienceModal();
        break;
      case 'services':
        this.renderServicesModal();
        break;
      case 'contact':
        this.renderContactModal();
        break;
      case 'help':
        this.renderHelpModal();
        break;
      case 'pause':
        this.renderPauseModal();
        break;
      default:
        this.closeModal();
        return;
    }

    this.modalBackdrop.hidden = false;
    this.modalContainer.tabIndex = -1;
    this.modalContainer.focus();
  }

  closeModal(): void {
    if (!this.modalBackdrop.hidden) {
      soundEffects.playClose();
    }
    this.modalBackdrop.hidden = true;
    this.activeModalId = null;
    this.modalContainer.replaceChildren();
    eventBus.emit(GameEvents.PAUSE_GAME, { paused: false });
  }

  // A. Portfolio / Projects Modal
  private renderPortfolioModal(filter = 'All'): void {
    const card = el('div', 'pq-modal-card pq-modal-wide');

    const header = el('div', 'pq-modal-header');
    const titleBox = el('div');
    titleBox.append(
      el('span', 'pq-modal-kicker', '✦ PROJECTS WORKSHOP ✦'),
      el('h2', 'pq-modal-title', 'Portfolio Hall'),
    );
    const closeBtn = el('button', 'pq-modal-close', '✕');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close Projects Modal');
    closeBtn.addEventListener('click', () => this.closeModal());
    header.append(titleBox, closeBtn);

    // Filter Buttons
    const filterRow = el('div', 'pq-filter-row');
    const categories = ['All', 'Game Dev', 'Full-Stack', 'Tools'];
    categories.forEach((cat) => {
      const btn = el('button', `pq-filter-btn ${cat === filter ? 'is-active' : ''}`, cat);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        soundEffects.playInteract();
        this.renderPortfolioModal(cat);
      });
      filterRow.append(btn);
    });

    const grid = el('div', 'pq-projects-grid');
    const filteredProjects =
      filter === 'All' ? PROJECTS : PROJECTS.filter((p) => p.category === filter);

    filteredProjects.forEach((proj) => {
      const item = el('article', 'pq-project-card');

      const thumb = el('div', 'pq-project-thumb');
      thumb.style.backgroundColor = proj.imagePlaceholderColor || '#222443';
      const badge = el('span', 'pq-project-cat', proj.category);
      const icon = el('span', 'pq-project-icon', proj.category === 'Game Dev' ? '🎮' : proj.category === 'Full-Stack' ? '🌐' : '⚙');
      thumb.append(badge, icon);

      const body = el('div', 'pq-project-body');
      const h3 = el('h3', 'pq-project-title', proj.title);
      const desc = el('p', 'pq-project-desc', proj.shortDescription);

      const techList = el('div', 'pq-tech-pills');
      proj.technologies.slice(0, 4).forEach((tech) => {
        techList.append(el('span', 'pq-tech-pill', tech));
      });

      const actions = el('div', 'pq-project-actions');
      const detailsBtn = el('button', 'pq-btn pq-btn-gold pq-btn-sm', 'View Details');
      detailsBtn.type = 'button';
      detailsBtn.addEventListener('click', () => this.openModal('project-detail', proj.id));
      actions.append(detailsBtn);

      if (proj.githubUrl) {
        const gh = el('a', 'pq-btn pq-btn-sm', 'GitHub');
        gh.href = proj.githubUrl;
        gh.target = '_blank';
        gh.rel = 'noopener noreferrer';
        actions.append(gh);
      }
      if (proj.liveUrl && proj.liveUrl !== './') {
        const demo = el('a', 'pq-btn pq-btn-secondary pq-btn-sm', 'Live Demo');
        demo.href = proj.liveUrl;
        demo.target = '_blank';
        demo.rel = 'noopener noreferrer';
        actions.append(demo);
      }

      body.append(h3, desc, techList, actions);
      item.append(thumb, body);
      grid.append(item);
    });

    card.append(header, filterRow, grid);
    this.modalContainer.replaceChildren(card);
  }

  // B. Project Detail Modal
  private renderProjectDetailModal(projectId?: string): void {
    const proj = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0]!;
    const card = el('div', 'pq-modal-card');

    const header = el('div', 'pq-modal-header');
    const titleBox = el('div');
    titleBox.append(
      el('span', 'pq-modal-kicker', `✦ ${proj.category.toUpperCase()} PROJECT ✦`),
      el('h2', 'pq-modal-title', proj.title),
    );
    const closeBtn = el('button', 'pq-modal-close', '✕');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close Project Details');
    closeBtn.addEventListener('click', () => this.openModal('portfolio'));
    header.append(titleBox, closeBtn);

    const body = el('div', 'pq-detail-body');

    const descSection = el('section', 'pq-detail-section');
    descSection.append(
      el('h4', 'pq-section-title', 'Overview'),
      el('p', undefined, proj.fullDescription),
    );

    const probSection = el('section', 'pq-detail-section');
    probSection.append(
      el('h4', 'pq-section-title', 'Challenge & Solution'),
      el('p', undefined, proj.problemSolved),
    );

    const featSection = el('section', 'pq-detail-section');
    featSection.append(el('h4', 'pq-section-title', 'Key Architecture & Features'));
    const featList = el('ul', 'pq-detail-list');
    proj.keyFeatures.forEach((f) => featList.append(el('li', undefined, f)));
    featSection.append(featList);

    const techSection = el('section', 'pq-detail-section');
    techSection.append(el('h4', 'pq-section-title', 'Technologies'));
    const techPills = el('div', 'pq-tech-pills');
    proj.technologies.forEach((t) => techPills.append(el('span', 'pq-tech-pill', t)));
    techSection.append(techPills);

    const footer = el('div', 'pq-modal-footer');
    const backBtn = el('button', 'pq-btn pq-btn-secondary', '◀ Back to Workshop');
    backBtn.type = 'button';
    backBtn.addEventListener('click', () => this.openModal('portfolio'));
    footer.append(backBtn);

    if (proj.githubUrl) {
      const gh = el('a', 'pq-btn pq-btn-gold', 'View on GitHub ↗');
      gh.href = proj.githubUrl;
      gh.target = '_blank';
      gh.rel = 'noopener noreferrer';
      footer.append(gh);
    }

    body.append(descSection, probSection, featSection, techSection);
    card.append(header, body, footer);
    this.modalContainer.replaceChildren(card);
  }

  // C. Skills Modal
  private renderSkillsModal(): void {
    const card = el('div', 'pq-modal-card pq-modal-wide');

    const header = el('div', 'pq-modal-header');
    const titleBox = el('div');
    titleBox.append(
      el('span', 'pq-modal-kicker', '⚔ TECHNICAL ABILITIES ⚔'),
      el('h2', 'pq-modal-title', 'The Skills Forge'),
    );
    const closeBtn = el('button', 'pq-modal-close', '✕');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => this.closeModal());
    header.append(titleBox, closeBtn);

    const grid = el('div', 'pq-skills-grid');

    SKILL_CATEGORIES.forEach((cat) => {
      const catBox = el('div', 'pq-skill-cat');
      const catTitle = el('h3', 'pq-skill-cat-title');
      catTitle.append(
        el('span', 'pq-skill-cat-icon', cat.icon),
        document.createTextNode(` ${cat.title}`),
      );
      catBox.append(catTitle);

      const list = el('div', 'pq-skill-list');
      cat.skills.forEach((s) => {
        const item = el('div', 'pq-skill-item');
        const topRow = el('div', 'pq-skill-item-top');
        const name = el('strong', 'pq-skill-name', s.name);
        const level = el('span', 'pq-skill-level', s.level);
        topRow.append(name, level);

        const note = el('div', 'pq-skill-note', s.note);
        item.append(topRow, note);
        list.append(item);
      });

      catBox.append(list);
      grid.append(catBox);
    });

    card.append(header, grid);
    this.modalContainer.replaceChildren(card);
  }

  // D. About Modal
  private renderAboutModal(): void {
    const card = el('div', 'pq-modal-card');

    const header = el('div', 'pq-modal-header');
    const titleBox = el('div');
    titleBox.append(
      el('span', 'pq-modal-kicker', '📜 DEVELOPER PROFILE 📜'),
      el('h2', 'pq-modal-title', 'About Cottage'),
    );
    const closeBtn = el('button', 'pq-modal-close', '✕');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => this.closeModal());
    header.append(titleBox, closeBtn);

    const body = el('div', 'pq-detail-body');

    // Profile card
    const devBio = el('div', 'pq-about-intro');
    const avatar = el('div', 'pq-about-avatar', '🧙‍♂️');
    const devMeta = el('div', 'pq-about-meta');
    devMeta.append(
      el('h3', 'pq-about-name', DEVELOPER_PROFILE.name),
      el('p', 'pq-about-title', DEVELOPER_PROFILE.title),
      el('p', 'pq-about-loc', `📍 ${DEVELOPER_PROFILE.location}`),
    );
    devBio.append(avatar, devMeta);

    const bioSection = el('div', 'pq-about-text');
    DEVELOPER_PROFILE.bio.forEach((paragraph) => {
      bioSection.append(el('p', undefined, paragraph));
    });

    const highlightsBox = el('div', 'pq-about-highlights');
    highlightsBox.append(el('h4', 'pq-section-title', 'Core Highlights'));
    const hlList = el('ul', 'pq-detail-list');
    DEVELOPER_PROFILE.highlights.forEach((h) => hlList.append(el('li', undefined, h)));
    highlightsBox.append(hlList);

    const footer = el('div', 'pq-modal-footer');
    const contactBtn = el('button', 'pq-btn pq-btn-gold', 'Contact Me ✉');
    contactBtn.type = 'button';
    contactBtn.addEventListener('click', () => this.openModal('contact'));

    const projBtn = el('button', 'pq-btn pq-btn-secondary', 'View Projects ✦');
    projBtn.type = 'button';
    projBtn.addEventListener('click', () => this.openModal('portfolio'));
    footer.append(projBtn, contactBtn);

    body.append(devBio, bioSection, highlightsBox);
    card.append(header, body, footer);
    this.modalContainer.replaceChildren(card);
  }

  // E. Contact Modal
  private renderContactModal(): void {
    const card = el('div', 'pq-modal-card');

    const header = el('div', 'pq-modal-header');
    const titleBox = el('div');
    titleBox.append(
      el('span', 'pq-modal-kicker', '✉ GET IN TOUCH ✉'),
      el('h2', 'pq-modal-title', 'Contact House & Notice Board'),
    );
    const closeBtn = el('button', 'pq-modal-close', '✕');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => this.closeModal());
    header.append(titleBox, closeBtn);

    const body = el('div', 'pq-detail-body');

    // Fast Contact Cards
    const cardsRow = el('div', 'pq-contact-cards');

    const emailCard = el('div', 'pq-contact-chip');
    emailCard.append(
      el('div', 'pq-contact-label', 'Direct Email'),
      el('div', 'pq-contact-val', DEVELOPER_PROFILE.email),
    );
    const copyBtn = el('button', 'pq-btn pq-btn-sm', 'Copy Email 📋');
    copyBtn.type = 'button';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(DEVELOPER_PROFILE.email).then(
        () => {
          soundEffects.playSuccess();
          this.showToast('📋 Email copied to clipboard!');
        },
        () => {
          this.showToast(`Contact: ${DEVELOPER_PROFILE.email}`);
        },
      );
    });
    emailCard.append(copyBtn);

    const ghCard = el('div', 'pq-contact-chip');
    ghCard.append(
      el('div', 'pq-contact-label', 'GitHub Profile'),
      el('div', 'pq-contact-val', DEVELOPER_PROFILE.name),
    );
    const ghLink = el('a', 'pq-btn pq-btn-sm', 'Visit GitHub ↗');
    ghLink.href = DEVELOPER_PROFILE.github;
    ghLink.target = '_blank';
    ghLink.rel = 'noopener noreferrer';
    ghCard.append(ghLink);

    cardsRow.append(emailCard, ghCard);

    // Interactive message form
    const formSection = el('section', 'pq-contact-form-section');
    formSection.append(el('h4', 'pq-section-title', 'Send a Message / Project Inquiry'));

    const form = el('form', 'pq-contact-form');
    form.noValidate = true;

    const nameGroup = el('div', 'pq-form-group');
    nameGroup.append(el('label', undefined, 'Your Name'));
    const nameInput = el('input', 'pq-form-input');
    nameInput.type = 'text';
    nameInput.placeholder = 'e.g. Alex Adventurer';
    nameInput.required = true;
    nameGroup.append(nameInput);

    const emailGroup = el('div', 'pq-form-group');
    emailGroup.append(el('label', undefined, 'Your Email'));
    const emailInput = el('input', 'pq-form-input');
    emailInput.type = 'email';
    emailInput.placeholder = 'e.g. alex@example.com';
    emailInput.required = true;
    emailGroup.append(emailInput);

    const subjectGroup = el('div', 'pq-form-group');
    subjectGroup.append(el('label', undefined, 'Subject'));
    const subjectInput = el('input', 'pq-form-input');
    subjectInput.type = 'text';
    subjectInput.placeholder = 'e.g. Project Inquiry / Collaboration';
    subjectGroup.append(subjectInput);

    const msgGroup = el('div', 'pq-form-group');
    msgGroup.append(el('label', undefined, 'Message'));
    const msgText = el('textarea', 'pq-form-input pq-form-textarea');
    msgText.placeholder = 'Write your message or inquiry here…';
    msgText.required = true;
    msgGroup.append(msgText);

    const formFeedback = el('div', 'pq-form-feedback');

    const submitBtn = el('button', 'pq-btn pq-btn-gold', 'Send via Email Client ✉');
    submitBtn.type = 'submit';

    form.append(nameGroup, emailGroup, subjectGroup, msgGroup, formFeedback, submitBtn);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const subject = subjectInput.value.trim() || 'Portfolio Inquiry';
      const message = msgText.value.trim();

      if (!name || !email || !message) {
        formFeedback.textContent = 'Please fill out your name, email, and message.';
        formFeedback.className = 'pq-form-feedback is-error';
        return;
      }

      if (!email.includes('@') || !email.includes('.')) {
        formFeedback.textContent = 'Please enter a valid email address.';
        formFeedback.className = 'pq-form-feedback is-error';
        return;
      }

      // Generate verified mailto link with encoded parameters
      const bodyText = `From: ${name} (${email})\n\n${message}`;
      const mailtoUrl = `mailto:${DEVELOPER_PROFILE.email}?subject=${encodeURIComponent(
        `[PixelQuest] ${subject}`,
      )}&body=${encodeURIComponent(bodyText)}`;

      // Copy text to clipboard as convenient fallback
      navigator.clipboard.writeText(`To: ${DEVELOPER_PROFILE.email}\nSubject: ${subject}\n\n${bodyText}`).catch(() => {});

      soundEffects.playSuccess();
      formFeedback.textContent =
        'Launching email client! Text also copied to clipboard as fallback.';
      formFeedback.className = 'pq-form-feedback is-success';

      window.location.href = mailtoUrl;
    });

    formSection.append(form);
    body.append(cardsRow, formSection);
    card.append(header, body);
    this.modalContainer.replaceChildren(card);
  }

  // F. How to Play Modal
  private renderHelpModal(): void {
    const card = el('div', 'pq-modal-card');

    const header = el('div', 'pq-modal-header');
    const titleBox = el('div');
    titleBox.append(
      el('span', 'pq-modal-kicker', '★ ADVENTURE GUIDE ★'),
      el('h2', 'pq-modal-title', 'How to Play'),
    );
    const closeBtn = el('button', 'pq-modal-close', '✕');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => this.closeModal());
    header.append(titleBox, closeBtn);

    const body = el('div', 'pq-detail-body');

    // Keyboard section
    const kbSection = el('section', 'pq-detail-section');
    kbSection.append(el('h4', 'pq-section-title', 'Desktop Keyboard & Mouse Controls'));
    const kbGrid = el('div', 'pq-controls-grid');

    const keys = [
      { key: 'W / ↑', action: 'Walk Up' },
      { key: 'S / ↓', action: 'Walk Down' },
      { key: 'A / ←', action: 'Walk Left' },
      { key: 'D / →', action: 'Walk Right' },
      { key: 'E / Space', action: 'Interact / Talk / Enter Building' },
      { key: 'Esc', action: 'Pause Menu / Close Active Dialog' },
      { key: 'M', action: 'Toggle Sound On/Off' },
      { key: 'Click/Hold', action: 'Steer towards mouse cursor' },
    ];

    keys.forEach((k) => {
      const item = el('div', 'pq-control-item');
      item.append(el('kbd', 'pq-key-badge', k.key), el('span', undefined, k.action));
      kbGrid.append(item);
    });
    kbSection.append(kbGrid);

    // Mobile touch section
    const touchSection = el('section', 'pq-detail-section');
    touchSection.append(el('h4', 'pq-section-title', 'Mobile Touch Controls'));
    const touchList = el('ul', 'pq-detail-list');
    touchList.append(
      el('li', undefined, 'Bottom-Left: Virtual D-pad for 4-directional walking.'),
      el('li', undefined, 'Bottom-Right: Contextual Action Button (lights up gold when near NPCs or doors).'),
      el('li', undefined, 'Tap to Navigate: Tap anywhere on open ground to steer the player.'),
      el('li', undefined, 'Top-Right HUD: Sound toggle, pause menu, and fullscreen.'),
    );
    touchSection.append(touchList);

    // Village Points of Interest
    const poiSection = el('section', 'pq-detail-section');
    poiSection.append(el('h4', 'pq-section-title', 'Village Landmarks'));
    const poiList = el('ul', 'pq-detail-list');
    poiList.append(
      el('li', undefined, '✦ Portfolio Hall (North): Browse featured projects and live demos.'),
      el('li', undefined, '⚔ Skills Forge (West): View technologies, frameworks, and skill levels.'),
      el('li', undefined, '📜 About Cottage (South-West): Developer background and engineering approach.'),
      el('li', undefined, '✉ Contact House (South-East): Social links and direct message board.'),
      el('li', undefined, '🧙‍♂️ Rowan the Guide (Plaza): Answers questions and gives village directions.'),
    );
    poiSection.append(poiList);

    const footer = el('div', 'pq-modal-footer');
    const okBtn = el('button', 'pq-btn pq-btn-gold', 'Got It! Let’s Explore ▶');
    okBtn.type = 'button';
    okBtn.addEventListener('click', () => this.closeModal());
    footer.append(okBtn);

    body.append(kbSection, touchSection, poiSection);
    card.append(header, body, footer);
    this.modalContainer.replaceChildren(card);
  }

  // G. Pause Menu Modal
  private renderPauseModal(): void {
    const card = el('div', 'pq-modal-card pq-modal-compact');

    const header = el('div', 'pq-modal-header');
    header.append(el('h2', 'pq-modal-title', '⏸ Game Paused'));
    const closeBtn = el('button', 'pq-modal-close', '✕');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => this.closeModal());
    header.append(closeBtn);

    const body = el('div', 'pq-pause-menu');

    const resumeBtn = el('button', 'pq-btn pq-btn-gold pq-btn-large', 'Resume Adventure');
    resumeBtn.type = 'button';
    resumeBtn.addEventListener('click', () => this.closeModal());

    const fastTravelBox = el('div', 'pq-fast-travel');
    fastTravelBox.append(el('h4', 'pq-section-title', 'Quick Travel'));
    const travelGrid = el('div', 'pq-travel-grid');

    const destinations = [
      { label: '⚒ Projects', modal: 'portfolio' },
      { label: '⚔ Skills', modal: 'skills' },
      { label: '📜 About', modal: 'about' },
      { label: '🛡 Experience', modal: 'experience' },
      { label: '⚖ Services', modal: 'services' },
      { label: '✉ Contact', modal: 'contact' },
    ];

    destinations.forEach((d) => {
      const btn = el('button', 'pq-btn pq-btn-secondary pq-btn-sm', d.label);
      btn.type = 'button';
      btn.addEventListener('click', () => this.openModal(d.modal));
      travelGrid.append(btn);
    });
    fastTravelBox.append(travelGrid);

    const soundToggle = el('button', 'pq-btn', soundEffects.isMuted ? '🔊 Unmute Sound' : '🔇 Mute Sound');
    soundToggle.type = 'button';
    soundToggle.addEventListener('click', () => {
      this.toggleSound();
      soundToggle.textContent = soundEffects.isMuted ? '🔊 Unmute Sound' : '🔇 Mute Sound';
    });

    const helpBtn = el('button', 'pq-btn', '❓ How to Play');
    helpBtn.type = 'button';
    helpBtn.addEventListener('click', () => this.openModal('help'));

    const spawnBtn = el('button', 'pq-btn', '🏠 Return to Plaza Spawn');
    spawnBtn.type = 'button';
    spawnBtn.addEventListener('click', () => {
      soundEffects.playInteract();
      eventBus.emit(GameEvents.TELEPORT_SPAWN);
      this.closeModal();
      this.showToast('Returned to Village Plaza spawn point.');
    });

    const titleBtn = el('button', 'pq-btn pq-btn-secondary', '↩ Return to Title Screen');
    titleBtn.type = 'button';
    titleBtn.addEventListener('click', () => {
      this.closeModal();
      this.hud.hidden = true;
      this.welcomeScreen.hidden = false;
      this.welcomeScreen.classList.remove('is-hidden');
    });

    body.append(resumeBtn, fastTravelBox, soundToggle, helpBtn, spawnBtn, titleBtn);
    card.append(header, body);
    this.modalContainer.replaceChildren(card);
  }

  // ---------------------------------------------------------------------------
  // Global Actions & Utilities
  // ---------------------------------------------------------------------------
  private toggleSound(): void {
    const isMuted = soundEffects.toggleMute();
    this.soundBtn.textContent = isMuted ? '🔇' : '🔊';
    this.showToast(isMuted ? '🔇 Sound muted' : '🔊 Sound enabled');
    eventBus.emit(GameEvents.SOUND_TOGGLE, { muted: isMuted });
  }

  private syncFullscreenButton(): void {
    const isFullscreen = Boolean(document.fullscreenElement);
    this.fsBtn.textContent = isFullscreen ? '✕' : '⛶';
    this.fsBtn.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
    this.fsBtn.title = isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen';
  }

  private async toggleFullscreen(): Promise<void> {
    soundEffects.playInteract();
    try {
      if (!document.fullscreenElement) {
        if (!document.documentElement.requestFullscreen) {
          this.showToast('Fullscreen is not supported by this browser.');
          return;
        }
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      this.syncFullscreenButton();
    } catch {
      this.syncFullscreenButton();
      this.showToast('Could not change fullscreen mode. Check browser permissions.');
    }
  }

  private showToast(message: string): void {
    const toast = el('div', 'pq-toast', message);
    this.toastContainer.append(toast);
    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), 400);
    }, 3200);
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

  private toggleAssetPanel(force?: boolean): void {
    const open = force ?? this.assetPanel.hidden;
    this.assetPanel.hidden = !open;
    this.assetBtn.setAttribute('aria-pressed', String(open));
    if (open) this.assetPanel.focus();
    else this.assetBtn.focus();
  }

  showFatalError(payload: FatalErrorPayload): void {
    window.clearInterval(this.loadingMsgInterval);
    window.clearInterval(this.typewriterTimer);
    this.hideSplash(true);
    this.errorTitle.textContent = payload.title;
    this.errorMessage.textContent = payload.message;
    this.errorDetails.replaceChildren(
      ...(payload.details ?? []).map((line) => el('li', undefined, line)),
    );
    this.errorOverlay.hidden = false;
  }

  private onViewport(vp: ViewportInfo): void {
    // Optionally update HUD attributes based on viewport
    if (vp.orientation === 'portrait') {
      this.hud.classList.add('is-portrait');
    } else {
      this.hud.classList.remove('is-portrait');
    }
  }
}
