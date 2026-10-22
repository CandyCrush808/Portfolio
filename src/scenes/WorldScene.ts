import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { eventBus, GameEvents } from '../core/EventBus';
import { PlayerController } from '../entities/PlayerController';
import { NPC } from '../entities/NPC';
import { InputController } from '../input/InputController';
import { WorldBuilder } from '../world/WorldBuilder';
import { VILLAGE } from '../world/maps/villageMap';
import { soundEffects } from '../audio/SoundEffects';

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
  { id: 'portfolio', label: 'PORTFOLIO HALL', x: 802, y: 350, radius: 190 },
  { id: 'skills', label: 'SKILLS FORGE', x: 280, y: 520, radius: 170 },
  { id: 'about', label: 'ABOUT COTTAGE', x: 560, y: 820, radius: 160 },
  { id: 'contact', label: 'CONTACT HOUSE', x: 1010, y: 820, radius: 160 },
  { id: 'pond', label: 'TRANQUIL POND', x: 1380, y: 720, radius: 180 },
  { id: 'plaza', label: 'MAIN PLAZA', x: 800, y: 720, radius: 210 },
];

/**
 * WorldScene: handles village exploration, NPC interaction, building trigger zones,
 * responsive camera scaling, and input dispatch.
 */
export class WorldScene extends Phaser.Scene {
  private player!: PlayerController;
  private npc!: NPC;
  private inputController!: InputController;
  private interactables: InteractableZone[] = [];
  private currentInteractable: InteractableZone | null = null;
  private currentZoneId = '';

  private debugBody?: Phaser.GameObjects.Graphics;
  private debugLabel?: Phaser.GameObjects.Text;
  private pointerMoveVector = new Phaser.Math.Vector2();
  private lastMinimapBroadcast = 0;
  private lastMinimapBroadcast = 0;

  constructor() {
    super(SCENE_KEYS.WORLD);
  }

  create(): void {
    // 1. Build world solids, ground, paths, buildings, and nature
    const blockers = new WorldBuilder(this).build();
    this.physics.world.setBounds(0, 0, VILLAGE.width, VILLAGE.height);

    // 2. Create player
    this.player = new PlayerController(this, VILLAGE.spawn);
    this.physics.add.collider(this.player, blockers);

    // 3. Create Rowan the Guide NPC
    this.npc = new NPC(this, 845, 740, 'guide', 'Rowan the Guide');
    this.physics.add.collider(this.player, this.npc);

    // 4. Setup Interactable Zones
    this.setupInteractables();

    // 5. Setup Camera & Responsive Zoom
    const camera = this.cameras.main;
    camera.setBounds(0, 0, VILLAGE.width, VILLAGE.height);

    const getWorldZoom = (): number => {
      if (window.innerWidth <= 600) return 0.44;
      if (window.innerWidth <= 900) return 0.46;
      if (window.innerHeight <= 540) return 0.46;
      return 0.50;
    };

    camera.setZoom(getWorldZoom());
    // Smooth camera follow with slight vertical offset to keep player comfortably centered
    camera.startFollow(this.player, true, 0.12, 0.12, 0, 24);
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
    this.interactables = [
      {
        id: 'guide',
        label: 'Rowan the Guide',
        hint: 'Talk to Rowan',
        x: 845,
        y: 740,
        radius: 80,
        action: () => this.npc.interact(),
      },
      {
        id: 'portfolio',
        label: 'Portfolio Hall',
        hint: 'Enter Portfolio Hall',
        x: 802,
        y: 445,
        radius: 75,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
            id: 'visit-portfolio',
            title: 'Inspect Portfolio Hall',
          });
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'portfolio' });
        },
      },
      {
        id: 'skills',
        label: 'Skills Forge',
        hint: 'Enter Skills Forge',
        x: 271,
        y: 606,
        radius: 75,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
            id: 'visit-skills',
            title: 'Visit the Skills Forge',
          });
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'skills' });
        },
      },
      {
        id: 'about',
        label: 'About Cottage',
        hint: 'Enter About Cottage',
        x: 560,
        y: 914,
        radius: 75,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'about' });
        },
      },
      {
        id: 'contact',
        label: 'Contact House',
        hint: 'Enter Contact House',
        x: 1007,
        y: 914,
        radius: 75,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OBJECTIVE_COMPLETED, {
            id: 'visit-contact',
            title: 'Check the Contact House',
          });
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'contact' });
        },
      },
      {
        id: 'notice-board',
        label: 'Plaza Notice Board',
        hint: 'Read Notice Board',
        x: 740,
        y: 760,
        radius: 65,
        action: () => {
          soundEffects.playOpen();
          eventBus.emit(GameEvents.OPEN_MODAL, { id: 'help' });
        },
      },
      {
        id: 'workshop',
        label: 'Workshop Site',
        hint: 'Inspect Workshop Site',
        x: 1354,
        y: 530,
        radius: 70,
        action: () => {
          soundEffects.playInteract();
          eventBus.emit(GameEvents.START_DIALOGUE, {
            lines: [
              {
                speaker: 'Village Signpost',
                title: 'Notice',
                avatarKey: 'sign',
                text: 'Workshop Site — Reserved for upcoming game engine modules, experimental canvas shaders, and creative labs. Under active construction!',
              },
            ],
          });
        },
      },
      {
        id: 'pond',
        label: 'Tranquil Pond',
        hint: 'Admire Tranquil Pond',
        x: 1320,
        y: 720,
        radius: 75,
        action: () => {
          soundEffects.playInteract();
          eventBus.emit(GameEvents.START_DIALOGUE, {
            lines: [
              {
                speaker: 'Tranquil Waters',
                title: 'Reflection',
                avatarKey: 'pond',
                text: 'Gentle ripples drift across the water. A peaceful spot in Pixel Town to take a breath and recharge.',
              },
            ],
          });
        },
      },
    ];
  }

  private setupEventListeners(): void {
    const onInteract = (): void => {
      // Dialogue and modal overlays freeze the player; ignore world actions until closed.
      if (this.player.isFrozen()) return;
      if (this.currentInteractable) {
        this.currentInteractable.action();
      }
    };

    const onStartDialogue = (): void => {
      this.player.setFrozen(true);
    };

    const onDialogueClosed = (): void => {
      // Defer unfreezing until the current INTERACT_ACTION event has finished
      // dispatching, otherwise the same input can immediately retrigger the NPC.
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
      if (this.npc) this.npc.destroy();
    });
  }

  update(time: number): void {
    const foot = this.player.footPoint;

    // Broadcast player coordinates at a modest rate for the DOM minimap.
    if (time - this.lastMinimapBroadcast >= 100) {
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

    // 2. Update NPC distance and facing
    if (this.npc) {
      this.npc.updatePlayerDistance(foot);
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
