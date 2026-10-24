import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { eventBus, GameEvents } from '../core/EventBus';
import { PlayerController } from '../entities/PlayerController';
import { NPC } from '../entities/NPC';
import { InputController } from '../input/InputController';
import { WorldBuilder } from '../world/WorldBuilder';
import { VILLAGE } from '../world/maps/villageMap';
import { soundEffects } from '../audio/SoundEffects';
import {
  GUIDE_DIALOGUE,
  ELENA_DIALOGUE,
  SILAS_DIALOGUE,
  FINN_DIALOGUE,
} from '../data/portfolioData';

interface InteractableZone {
  id: string;
  label: string;
  hint: string;
  x: number;
  y: number;
  radius: number;
  action: () => void;
}

interface ZoneDef {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
}

const WORLD_ZONES: ZoneDef[] = [
  { id: 'spawn',      label: 'SOUTHERN ENTRANCE',           x: 1024, y: 1380, radius: 180 },
  { id: 'plaza',      label: 'MAIN PLAZA & FOUNTAIN',        x: 1024, y: 800,  radius: 180 },
  { id: 'projects',   label: 'PROJECTS WORKSHOP',            x: 1024, y: 380,  radius: 160 },
  { id: 'skills',     label: 'SKILLS LIBRARY',               x: 358,  y: 460,  radius: 160 },
  { id: 'about',      label: 'ABOUT COTTAGE',                x: 290,  y: 820,  radius: 160 },
  { id: 'experience', label: 'EXPERIENCE GUILD HALL',         x: 1722, y: 480,  radius: 160 },
  { id: 'services',   label: 'SERVICES MARKET',              x: 1782, y: 820,  radius: 160 },
  { id: 'contact',    label: 'CONTACT INN',                  x: 1662, y: 1150, radius: 160 },
  { id: 'pond',       label: 'TRANQUIL POND & DOCK',         x: 440,  y: 1120, radius: 200 },
  { id: 'river',      label: 'EASTERN STREAM & BRIDGES',     x: 1900, y: 820,  radius: 180 },
];

/**
 * WorldScene: handles full 4096x3072 RPG village exploration, NPC interactions,
 * building trigger zones, responsive camera follow, and input dispatch.
 */
export class WorldScene extends Phaser.Scene {
  private player!: PlayerController;
  private npcs: NPC[] = [];
  private inputController!: InputController;
  private interactables: InteractableZone[] = [];
  private currentInteractable: InteractableZone | null = null;
  private currentZoneId = '';

  private debugBody?: Phaser.GameObjects.Graphics;
  private debugLabel?: Phaser.GameObjects.Text;
  private pointerMoveVector = new Phaser.Math.Vector2();
  private lastMinimapBroadcast = 0;

  constructor() {
    super(SCENE_KEYS.WORLD);
  }

  create(): void {
    // 1. Build world solids, ground, paths, buildings, rivers, and nature
    const blockers = new WorldBuilder(this).build();
    this.physics.world.setBounds(0, 0, VILLAGE.width, VILLAGE.height);

    // 2. Create player at southern spawn gate
    this.player = new PlayerController(this, VILLAGE.spawn);
    this.physics.add.collider(this.player, blockers);

    // 3. Create Village NPCs
    this.npcs = [
      // Rowan the Guide in Main Plaza
      new NPC(this, 970, 840, 'guide', 'Rowan the Guide', GUIDE_DIALOGUE, 0xf7d88c, 'talk-guide'),
      // Elena the Guildmaster at Experience Guild Hall
      new NPC(this, 1700, 510, 'elena', 'Guildmaster Elena', ELENA_DIALOGUE, 0xe87a7a, 'visit-experience'),
      // Silas the Merchant at Services Market
      new NPC(this, 1750, 840, 'silas', 'Merchant Silas', SILAS_DIALOGUE, 0x82c4f5, 'visit-services'),
      // Finn the Barkeep at Contact Inn
      new NPC(this, 1630, 1170, 'finn', 'Barkeep Finn', FINN_DIALOGUE, 0xf0ab65, 'visit-contact'),
    ];

    for (const npc of this.npcs) {
      this.physics.add.collider(this.player, npc);
    }

    // 4. Setup Interactable Zones
    this.setupInteractables();

    // 5. Setup Camera & Responsive Zoom
    const camera = this.cameras.main;
    camera.setBounds(0, 0, VILLAGE.width, VILLAGE.height);

    const getWorldZoom = (): number => {
      // Cozy close-up: show roughly 700-900px of the 2048px world width at a time
      if (window.innerWidth <= 480)  return 0.75;
      if (window.innerWidth <= 768)  return 0.85;
      if (window.innerWidth <= 1200) return 0.95;
      return 1.05;
    };

    camera.setZoom(getWorldZoom());
    // Smooth camera follow
    camera.startFollow(this.player, true, 0.10, 0.10, 0, 12);
    camera.roundPixels = true;

    const updateWorldZoom = (): void => {
      camera.setZoom(getWorldZoom());
    };
    window.addEventListener('resize', updateWorldZoom);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('resize', updateWorldZoom);
    });

    // 6. Input system
    this.inputController = new InputController(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputController.destroy());

    // 7. Event listeners for UI interaction and player freeze
    this.setupEventListeners();

    // 8. Debug mode (if URL has ?debug)
    if (new URLSearchParams(window.location.search).has('debug')) {
      this.debugBody = this.add.graphics().setDepth(5000);
      this.debugLabel = this.add
        .text(8, 8, '', {
          fontSize: '12px',
          color: '#fff0cc',
          backgroundColor: '#17172F',
          padding: { x: 5, y: 4 },
        })
        .setScrollFactor(0)
        .setDepth(5001);
    }

    // Initial zone broadcast
    this.updateZone(true);

    eventBus.emit(GameEvents.GAME_READY);
  }

  private setupInteractables(): void {
    const npcMap = new Map(this.npcs.map((n) => [n.id, n]));

    this.interactables = [
      // NPCs
      {
        id: 'guide',
        label: 'Rowan the Guide',
        hint: 'Talk to Rowan',
        x: 2000,
        y: 1500,
        radius: 85,
        action: () => npcMap.get('guide')?.interact(),
      },
      {
        id: 'elena',
        label: 'Guildmaster Elena',
        hint: 'Speak with Elena',
        x: 2800,
        y: 890,
        radius: 85,
        action: () => npcMap.get('elena')?.interact(),
      },
      {
        id: 'silas',
        label: 'Merchant Silas',
        hint: 'Trade with Silas',
        x: 2600,
        y: 1560,
        radius: 85,
        action: () => npcMap.get('silas')?.interact(),
      },
      {
        id: 'finn',
        label: 'Barkeep Finn',
        hint: 'Talk to Finn',
        x: 2760,
        y: 2240,
        radius: 85,
        action: () => npcMap.get('finn')?.interact(),
      },

      // Portfolio Building 1: About Me Cottage
      {
        id: 'about',
        label: 'About Me Cottage',
        hint: 'Enter About Me Cottage',
        x: 1068,
        y: 1540,
        radius: 85,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
            id: 'visit-about',
            title: 'Inspect About Me Cottage',
          });
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'about' });
        },
      },

      // Portfolio Building 2: Projects Workshop
      {
        id: 'projects',
        label: 'Projects Workshop',
        hint: 'Enter Projects Workshop',
        x: 2048,
        y: 880,
        radius: 85,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
            id: 'visit-portfolio',
            title: 'Inspect Projects Workshop',
          });
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'portfolio' });
        },
      },

      // Portfolio Building 3: Skills Library
      {
        id: 'skills',
        label: 'Skills Library',
        hint: 'Enter Skills Library',
        x: 1368,
        y: 900,
        radius: 85,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
            id: 'visit-skills',
            title: 'Visit the Skills Library',
          });
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'skills' });
        },
      },

      // Portfolio Building 4: Experience Guild Hall
      {
        id: 'experience',
        label: 'Experience Guild Hall',
        hint: 'Enter Experience Guild Hall',
        x: 2848,
        y: 860,
        radius: 85,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
            id: 'visit-experience',
            title: 'Enter Experience Guild Hall',
          });
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'experience' });
        },
      },

      // Portfolio Building 5: Services Market
      {
        id: 'services',
        label: 'Services Market',
        hint: 'Enter Services Market',
        x: 2648,
        y: 1540,
        radius: 85,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
            id: 'visit-services',
            title: 'Browse the Services Market',
          });
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'services' });
        },
      },

      // Portfolio Building 6: Contact Inn
      {
        id: 'contact',
        label: 'Contact Inn',
        hint: 'Enter Contact Inn',
        x: 2808,
        y: 2220,
        radius: 85,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
            id: 'visit-contact',
            title: 'Check the Contact Inn',
          });
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'contact' });
        },
      },

      // Decorative House 1
      {
        id: 'house1',
        label: 'Forest Cottage',
        hint: 'Inspect Forest Cottage',
        x: 648,
        y: 960,
        radius: 80,
        action: () => {
          soundEffects.playInteract();
          eventBus.emit(GameEvents.START_DIALOGUE, {
            lines: [
              {
                speaker: 'Forest Cottage',
                title: 'Resident Notes',
                avatarKey: 'sign',
                text: 'A charming timber cottage nestled deep in the northwestern woods. The aroma of warm herbal tea and fresh pine drifts from the chimney.',
              },
            ],
          });
        },
      },

      // Decorative House 2
      {
        id: 'house2',
        label: 'Riverside Homestead',
        hint: 'Inspect Riverside Homestead',
        x: 508,
        y: 1700,
        radius: 80,
        action: () => {
          soundEffects.playInteract();
          eventBus.emit(GameEvents.START_DIALOGUE, {
            lines: [
              {
                speaker: 'Riverside Homestead',
                title: 'Resident Notes',
                avatarKey: 'sign',
                text: 'A quiet homestead bordering the western bluffs. Hand-carved wooden tools rest neatly against the garden fence.',
              },
            ],
          });
        },
      },

      // Plaza Notice Board
      {
        id: 'notice-board',
        label: 'Plaza Notice Board',
        hint: 'Read Notice Board',
        x: 1950,
        y: 1560,
        radius: 75,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'help' });
        },
      },

      // Central Fountain
      {
        id: 'fountain',
        label: 'Stone Fountain',
        hint: 'Admire Fountain',
        x: 2048,
        y: 1440,
        radius: 90,
        action: () => {
          soundEffects.playInteract();
          eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
            id: 'explore-plaza',
            title: 'Explore the Main Plaza',
          });
          eventBus.emit(GameEvents.START_DIALOGUE, {
            lines: [
              {
                speaker: 'Stone Fountain',
                title: 'Village Landmark',
                avatarKey: 'fountain',
                text: 'The grand village fountain gushes sparkling clear water. A tranquil centerpiece connecting every corner of Pixel Town.',
              },
            ],
          });
        },
      },

      // Tranquil Pond & Fishing Dock
      {
        id: 'pond',
        label: 'Tranquil Pond Dock',
        hint: 'Inspect Fishing Dock',
        x: 1000,
        y: 2220,
        radius: 85,
        action: () => {
          soundEffects.playInteract();
          eventBus.emit(GameEvents.START_DIALOGUE, {
            lines: [
              {
                speaker: 'Tranquil Pond',
                title: 'Reflection',
                avatarKey: 'pond',
                text: 'Gentle ripples drift across the water as a western waterfall tumbles softly into the pond. Lily pads bob lazily in the breeze.',
              },
            ],
          });
        },
      },

      // Southern Entrance Arch
      {
        id: 'arch',
        label: 'Village Gateway',
        hint: 'Inspect Gateway',
        x: 2048,
        y: 2520,
        radius: 80,
        action: () => {
          soundEffects.playInteract();
          eventBus.emit(GameEvents.START_DIALOGUE, {
            lines: [
              {
                speaker: 'Village Archway',
                title: 'PixelQuest Gateway',
                avatarKey: 'sign',
                text: 'Welcome to Pixel Town! Head North along the golden avenue to reach the central fountain and begin your adventure.',
              },
            ],
          });
        },
      },
    ];
  }

  private setupEventListeners(): void {
    const onInteract = (): void => {
      if (this.player.isFrozen()) return;
      if (this.currentInteractable) {
        this.currentInteractable.action();
      }
    };

    const onStartDialogue = (): void => {
      this.player.setFrozen(true);
    };

    const onDialogueClosed = (): void => {
      this.time.delayedCall(0, () => this.player.setFrozen(false));
    };

    const onOpenModal = (payload: { id: string }): void => {
      if (payload.id !== 'pause-toggle') {
        this.player.setFrozen(true);
      }
    };

    const onCloseModal = (): void => {
      this.player.setFrozen(false);
    };

    const onPauseGame = (payload: { paused: boolean }): void => {
      this.player.setFrozen(payload.paused);
    };

    const onTeleportSpawn = (): void => {
      this.player.teleport(VILLAGE.spawn.x, VILLAGE.spawn.y);
      this.player.setFrozen(false);
      this.updateZone(true);
    };

    eventBus.on(GameEvents.INTERACT_ACTION, onInteract, this);
    eventBus.on(GameEvents.START_DIALOGUE, onStartDialogue, this);
    eventBus.on(GameEvents.DIALOGUE_CLOSED, onDialogueClosed, this);
    eventBus.on(GameEvents.OPEN_MODAL, onOpenModal, this);
    eventBus.on(GameEvents.CLOSE_MODAL, onCloseModal, this);
    eventBus.on(GameEvents.PAUSE_GAME, onPauseGame, this);
    eventBus.on(GameEvents.TELEPORT_SPAWN, onTeleportSpawn, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off(GameEvents.INTERACT_ACTION, onInteract, this);
      eventBus.off(GameEvents.START_DIALOGUE, onStartDialogue, this);
      eventBus.off(GameEvents.DIALOGUE_CLOSED, onDialogueClosed, this);
      eventBus.off(GameEvents.OPEN_MODAL, onOpenModal, this);
      eventBus.off(GameEvents.CLOSE_MODAL, onCloseModal, this);
      eventBus.off(GameEvents.PAUSE_GAME, onPauseGame, this);
      eventBus.off(GameEvents.TELEPORT_SPAWN, onTeleportSpawn, this);
      for (const npc of this.npcs) npc.destroy();
    });
  }

  update(time: number): void {
    const foot = this.player.footPoint;

    // Broadcast player coordinates at a steady rate for the DOM minimap
    if (time - this.lastMinimapBroadcast >= 80) {
      this.lastMinimapBroadcast = time;
      eventBus.emit(GameEvents.PLAYER_POSITION, { x: foot.x, y: foot.y });
    }

    // 1. Process movement
    if (!this.player.isFrozen()) {
      const inputVector = this.inputController.getMovement();
      let moveVector = inputVector;

      // Pointer steering (mouse click & drag outside UI buttons)
      const pointer = this.input.activePointer;
      if (inputVector.lengthSq() === 0 && pointer.isDown && pointer.leftButtonDown()) {
        const worldPointer = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const dist = Phaser.Math.Distance.Between(foot.x, foot.y, worldPointer.x, worldPointer.y);
        if (dist > 18) {
          this.pointerMoveVector.set(worldPointer.x - foot.x, worldPointer.y - foot.y).normalize();
          moveVector = this.pointerMoveVector;
        }
      }

      this.player.updateMovement(moveVector);
    } else {
      this.player.updateMovement(Phaser.Math.Vector2.ZERO);
    }

    // 2. Update NPCs distance and facing
    for (const npc of this.npcs) {
      npc.updatePlayerDistance(foot);
    }

    // 3. Check interactables in proximity
    this.updateInteractables(foot);

    // 4. Update zone indicator
    this.updateZone();

    // 5. Debug overlay if enabled
    if (this.debugBody && this.debugLabel) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      this.debugBody
        .clear()
        .lineStyle(2, 0xff4f65, 1)
        .strokeRect(body.x, body.y, body.width, body.height)
        .fillStyle(0x83d17b, 1)
        .fillCircle(foot.x, foot.y, 3);
      this.debugLabel.setText(
        `Facing: ${this.player.facing} | ${this.player.isMoving ? 'walking' : 'idle'} | Zone: ${this.currentZoneId}`,
      );
    }
  }

  private updateInteractables(foot: Phaser.Math.Vector2): void {
    let closest: InteractableZone | null = null;
    let minDistance = Infinity;

    for (const item of this.interactables) {
      const dist = Phaser.Math.Distance.Between(foot.x, foot.y, item.x, item.y);
      if (dist <= item.radius && dist < minDistance) {
        minDistance = dist;
        closest = item;
      }
    }

    if (closest !== this.currentInteractable) {
      this.currentInteractable = closest;
      eventBus.emit(GameEvents.INTERACTION_HINT, closest ? { text: closest.hint, key: closest.id } : null);
    }
  }

  private updateZone(force = false): void {
    const foot = this.player.footPoint;
    let foundZone: ZoneDef | null = null;

    for (const zone of WORLD_ZONES) {
      const dist = Phaser.Math.Distance.Between(foot.x, foot.y, zone.x, zone.y);
      if (dist <= zone.radius) {
        foundZone = zone;
        break;
      }
    }

    const nextId = foundZone ? foundZone.id : 'village';
    const nextLabel = foundZone ? foundZone.label : 'PIXEL TOWN';

    if (force || nextId !== this.currentZoneId) {
      this.currentZoneId = nextId;
      eventBus.emit(GameEvents.ZONE_CHANGED, { zoneId: nextId, label: nextLabel });
    }
  }
}
