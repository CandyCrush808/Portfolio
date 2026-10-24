import * as Phaser from 'phaser';
import { VILLAGE } from './maps/villageMap';

export const WORLD_REQUIRED_TEXTURES = [
  'terrain-atlas',
  'building-about-me',
  'building-projects',
  'building-skills',
  'building-guild-hall',
  'building-services',
  'building-contact',
  'building-house-1',
  'building-house-2',
  'player-atlas',
] as const;

export class WorldBuilder {
  constructor(private readonly scene: Phaser.Scene) {}

  build(): Phaser.Physics.Arcade.StaticGroup {
    const { scene } = this;
    this.createWorldCanvasTextures();

    // 1. Register named frames from the terrain atlas
    this.registerTerrainFrames();

    // 2. Continuous grass ground (no navy gaps)
    this.buildTerrainGround();

    // 3. Crop plots — cozy farm atmosphere
    this.buildCropPlots();

    // 4. Water bodies from real terrain tiles
    this.buildWaterBodies();

    // 5. Dirt path network
    this.buildPathsAndPlaza();

    // 6. Bridges and dock crossings
    this.buildBridgesAndDocks();

    // 7. Solid collision group
    const solids = scene.physics.add.staticGroup();
    const addBox = (x: number, y: number, w: number, h: number, label: string): void => {
      const obj = scene.add
        .rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0)
        .setOrigin(0.5)
        .setVisible(false);
      scene.physics.add.existing(obj, true);
      (obj.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h);
      obj.setData('collisionLabel', label);
      solids.add(obj);
    };

    // 8. World boundary collisions
    this.buildWorldBoundaries(addBox);

    // 9. Water collision blocks (with bridge cutouts)
    this.buildWaterCollisions(addBox);

    // 10. Buildings with signs
    const icons: Record<string, string> = {
      about:      '📜 ',
      projects:   '⚒ ',
      skills:     '⚔ ',
      experience: '🛡 ',
      services:   '⚖ ',
      contact:    '✉ ',
      house1:     '🏡 ',
      house2:     '🏠 ',
    };

    for (const b of VILLAGE.buildings) {
      const texture = scene.textures.get(b.texture);
      const source = texture.getSourceImage() as HTMLImageElement;
      const srcW = source.width || b.width;
      const srcH = source.height || b.height;
      const fit = Math.min(b.width / srcW, b.height / srcH);
      const dw = srcW * fit;
      const dh = srcH * fit;

      scene.add
        .image(b.x + (b.width - dw) / 2, b.y + b.height - dh, b.texture)
        .setOrigin(0, 0)
        .setDisplaySize(dw, dh)
        .setDepth(b.y + b.height);

      b.collision.forEach((r, idx) => {
        addBox(r.x, r.y, r.width, r.height, `${b.label} wall ${idx + 1}`);
      });

      // Building name sign — warm wood colour, pixel-art feel
      const doorY = b.y + b.height - 16;
      const icon = icons[b.id] ?? '✦ ';
      const sign = scene.add
        .text(b.x + b.width / 2, doorY + 4, `${icon}${b.label}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          color: '#fff0cc',
          backgroundColor: '#4a2e10',
          stroke: '#c8903a',
          strokeThickness: 1,
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5, 0)
        .setDepth(doorY + 12);

      scene.tweens.add({
        targets: sign,
        alpha: 0.85,
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // 11. Props (trees, fences, fountain, lamps, etc.)
    this.buildProps(addBox);

    // 12. Plaza notice board
    const nbX = 1024;
    const nbY = 1060;
    scene.add
      .image(nbX, nbY, 'village-notice-board')
      .setOrigin(0.5, 0.85)
      .setDepth(nbY);
    addBox(nbX - 14, nbY - 18, 28, 18, 'notice board');

    this.debug(solids);
    return solids;
  }

  // ── Canvas-generated textures (no image file required) ────────────────────
  private createWorldCanvasTextures(): void {
    const { scene } = this;

    // Notice board
    if (!scene.textures.exists('village-notice-board')) {
      const nb = scene.make.graphics({ x: 0, y: 0 });
      nb.fillStyle(0x5c3317).fillRect(5, 16, 4, 18).fillRect(21, 16, 4, 18);
      nb.fillStyle(0x7a4728).fillRect(2, 2, 26, 18);
      nb.lineStyle(1, 0x3a2010, 1).strokeRect(2, 2, 26, 18);
      nb.fillStyle(0xf5ebd2).fillRect(4, 4, 20, 14);
      nb.fillStyle(0x26332c, 0.7).fillRect(6, 7, 14, 2).fillRect(6, 11, 10, 2);
      nb.fillStyle(0xe85d5d).fillCircle(14, 4, 1.5);
      nb.generateTexture('village-notice-board', 30, 36);
      nb.destroy();
    }

    // Stone steps at southern entrance
    if (!scene.textures.exists('stone-steps')) {
      const st = scene.make.graphics({ x: 0, y: 0 });
      st.fillStyle(0x8a9199).fillRect(0, 0, 120, 16);
      st.fillStyle(0x767d84).fillRect(8, 16, 104, 16);
      st.fillStyle(0x62686e).fillRect(16, 32, 88, 16);
      st.generateTexture('stone-steps', 120, 48);
      st.destroy();
    }

    // Crop soil plot texture (a single dirt square with furrow lines)
    if (!scene.textures.exists('crop-soil')) {
      const cs = scene.make.graphics({ x: 0, y: 0 });
      cs.fillStyle(0xa07850).fillRect(0, 0, 48, 32);
      cs.lineStyle(1, 0x7a5c38, 0.9);
      for (let y = 6; y < 32; y += 8) cs.lineBetween(0, y, 48, y);
      cs.generateTexture('crop-soil', 48, 32);
      cs.destroy();
    }

    // Tiny crop sprout (green tuft)
    if (!scene.textures.exists('crop-sprout')) {
      const sp = scene.make.graphics({ x: 0, y: 0 });
      sp.fillStyle(0x5a9e3a).fillTriangle(8, 16, 16, 0, 24, 16);
      sp.fillStyle(0x82c84a).fillTriangle(6, 16, 12, 4, 18, 16);
      sp.generateTexture('crop-sprout', 32, 20);
      sp.destroy();
    }

    // Tall crop (wheat-like)
    if (!scene.textures.exists('crop-wheat')) {
      const wh = scene.make.graphics({ x: 0, y: 0 });
      wh.fillStyle(0xd4a832).fillRect(7, 0, 4, 20);
      wh.fillStyle(0xe8c048).fillTriangle(5, 5, 11, 0, 17, 5);
      wh.fillStyle(0xc89820).fillRect(6, 14, 6, 6);
      wh.generateTexture('crop-wheat', 24, 26);
      wh.destroy();
    }
  }

  // ── Terrain frame registration ─────────────────────────────────────────────
  private registerTerrainFrames(): void {
    const atlas = this.scene.textures.get('terrain-atlas');
    // Verified coordinates from terrain-tiles.json audit
    const frames = [
      // Grass variants (band 0, y=0..77)
      ['terrain-grass',   0,   0, 72, 77],
      ['terrain-grass-2', 237, 0, 70, 77],
      ['terrain-grass-3', 474, 0, 71, 77],
      ['terrain-grass-4', 80,  0, 72, 77],
      // Dirt path (band 1, y=81..153)
      ['terrain-dirt',    238, 81, 69, 73],
      ['terrain-dirt-2',  0,   81, 70, 73],
      // Cobblestone (band 2, y=158..226)
      ['terrain-cobble',  3,   158, 65, 69],
      // Water (band 4, y=309..377)
      ['terrain-water',   0,   309, 67, 68],
      ['terrain-water-2', 85,  309, 62, 69],
      // Water edges (band 5, y=385..458)
      ['terrain-water-edge',  0,   385, 73, 74],
      ['terrain-water-edge-2', 245, 385, 62, 74],
      // Vegetation detail (band 9, y=699..758)
      ['terrain-vegetation', 242, 699, 57, 60],
    ] as const;

    for (const [key, x, y, width, height] of frames) {
      if (!atlas.has(key)) atlas.add(key, 0, x, y, width, height);
    }
  }

  // ── Grass ground covering ──────────────────────────────────────────────────
  private buildTerrainGround(): void {
    const { scene } = this;

    // Base grass tile covering the entire map — no gaps, no navy showing through
    scene.add
      .tileSprite(0, 0, VILLAGE.width, VILLAGE.height, 'terrain-atlas', 'terrain-grass')
      .setOrigin(0, 0)
      .setDepth(-20);

    // Secondary grass tile for texture variation — tiled across the world
    scene.add
      .tileSprite(0, 0, VILLAGE.width, VILLAGE.height, 'terrain-atlas', 'terrain-grass-2')
      .setOrigin(0, 0)
      .setAlpha(0.25)
      .setDepth(-19);

    // Scattered grass clumps and vegetation details for visual richness
    let seed = 19;
    const rand = (): number => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 160; i++) {
      const x = 120 + rand() * (VILLAGE.width - 240);
      const y = 120 + rand() * (VILLAGE.height - 240);
      const variant = rand();
      const key = variant > 0.66 ? 'terrain-grass-3' : variant > 0.33 ? 'terrain-grass-4' : 'terrain-vegetation';
      scene.add
        .image(x, y, 'terrain-atlas', key)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(42, 42)
        .setAlpha(0.28 + rand() * 0.25)
        .setDepth(-18);
    }
  }

  // ── Crop plots — cozy farming atmosphere ──────────────────────────────────
  private buildCropPlots(): void {
    const { scene } = this;
    const depth = 3;

    // Farm plot 1 — north-east area (rows of soil + crop sprouts)
    const plot1 = { x: 1090, y: 1160, cols: 4, rows: 3, cellW: 52, cellH: 36 };
    for (let row = 0; row < plot1.rows; row++) {
      for (let col = 0; col < plot1.cols; col++) {
        const px = plot1.x + col * plot1.cellW;
        const py = plot1.y + row * plot1.cellH;
        scene.add.image(px, py, 'crop-soil').setOrigin(0, 0).setDisplaySize(48, 32).setDepth(depth);
        // Place a sprout or wheat in each cell
        const cropKey = (row + col) % 3 === 0 ? 'crop-wheat' : 'crop-sprout';
        scene.add
          .image(px + 24, py + 6, cropKey)
          .setOrigin(0.5, 1)
          .setDepth(depth + 1);
      }
    }

    // Farm plot 2 — west side near pond (smaller)
    const plot2 = { x: 540, y: 1060, cols: 3, rows: 2, cellW: 52, cellH: 36 };
    for (let row = 0; row < plot2.rows; row++) {
      for (let col = 0; col < plot2.cols; col++) {
        const px = plot2.x + col * plot2.cellW;
        const py = plot2.y + row * plot2.cellH;
        scene.add.image(px, py, 'crop-soil').setOrigin(0, 0).setDisplaySize(48, 32).setDepth(depth);
        if ((row + col) % 2 === 0) {
          scene.add
            .image(px + 24, py + 6, 'crop-sprout')
            .setOrigin(0.5, 1)
            .setDepth(depth + 1);
        }
      }
    }

    // Farm plot 3 — small herb garden near about-me cottage
    const plot3 = { x: 190, y: 870, cols: 3, rows: 2, cellW: 48, cellH: 32 };
    for (let row = 0; row < plot3.rows; row++) {
      for (let col = 0; col < plot3.cols; col++) {
        const px = plot3.x + col * plot3.cellW;
        const py = plot3.y + row * plot3.cellH;
        scene.add.image(px, py, 'crop-soil').setOrigin(0, 0).setDisplaySize(44, 28).setDepth(depth);
        scene.add
          .image(px + 22, py + 4, 'crop-sprout')
          .setOrigin(0.5, 1)
          .setDisplaySize(20, 14)
          .setDepth(depth + 1);
      }
    }
  }

  // ── Water bodies ──────────────────────────────────────────────────────────
  private buildWaterBodies(): void {
    const { scene } = this;
    const tile = (x: number, y: number, frame: string, size = 56, depth = 0): void => {
      scene.add
        .image(x, y, 'terrain-atlas', frame)
        .setDisplaySize(size, size)
        .setOrigin(0.5, 0.5)
        .setDepth(depth);
    };

    // Tranquil pond — southwest of village
    // Oval pond shape using ellipse-distance test
    const pondCX = 440, pondCY = 1120, pondRX = 160, pondRY = 110;
    for (let y = pondCY - pondRY - 30; y <= pondCY + pondRY + 30; y += 44) {
      for (let x = pondCX - pondRX - 30; x <= pondCX + pondRX + 30; x += 44) {
        const nx = (x - pondCX) / pondRX;
        const ny = (y - pondCY) / pondRY;
        const d = nx * nx + ny * ny;
        if (d <= 1.0) {
          const frame = ((Math.floor(x / 44) + Math.floor(y / 44)) % 3 === 0) ? 'terrain-water-2' : 'terrain-water';
          tile(x, y, frame, 40, 1);
        } else if (d <= 1.35 && (Math.floor(x / 44) + Math.floor(y / 44)) % 2 === 0) {
          tile(x, y, 'terrain-water-edge', 42, 1.5);
        }
      }
    }

    // Eastern stream / river alongside the east edge
    for (let y = 0; y < VILLAGE.height; y += 44) {
      const centerX = 1900 + Math.sin(y / 280) * 30;
      for (let x = centerX - 64; x <= centerX + 64; x += 44) {
        const isEdge = Math.abs(x - centerX) > 42;
        const frame = isEdge
          ? (((Math.floor(y / 44) + Math.floor(x / 44)) % 2 === 0) ? 'terrain-water-edge' : 'terrain-water-edge-2')
          : (((Math.floor(y / 44) + Math.floor(x / 44)) % 3 === 0) ? 'terrain-water-2' : 'terrain-water');
        tile(x, y, frame, 40, isEdge ? 1.5 : 1);
      }
    }
  }

  // ── Path network and plaza ─────────────────────────────────────────────────
  private buildPathsAndPlaza(): void {
    const { scene } = this;

    const stamp = (x: number, y: number, frame: string, size = 54, depth = 4, angle = 0): void => {
      scene.add
        .image(x, y, 'terrain-atlas', frame)
        .setDisplaySize(size, size)
        .setRotation(angle)
        .setOrigin(0.5, 0.5)
        .setDepth(depth);
    };

    // Dirt tile paths along every route
    for (const route of VILLAGE.paths) {
      for (let i = 0; i < route.length - 1; i++) {
        const a = route[i]!;
        const b = route[i + 1]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(distance / 28));
        // Terrain tiles are directional artwork; keep every tile upright.
        // Route geometry is created by tile placement, not by rotating the sprites.
        const angle = 0;
        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          // Alternate between dirt variants for natural variation
          const frame = (step % 3 === 0) ? 'terrain-dirt-2' : 'terrain-dirt';
          stamp(a.x + dx * t, a.y + dy * t, frame, 44, 4, angle);
        }
      }
    }

    // Cobblestone plaza around the central fountain
    for (let y = 720; y <= 900; y += 36) {
      for (let x = 880; x <= 1168; x += 36) {
        const dx = (x - 1024) / 154;
        const dy = (y - 810) / 100;
        if (dx * dx + dy * dy <= 1.15) stamp(x, y, 'terrain-cobble', 36, 5);
      }
    }

    // Cobblestone arrival pad at south entrance
    for (let y = 1400; y <= 1460; y += 30) {
      for (let x = 970; x <= 1078; x += 30) stamp(x, y, 'terrain-cobble', 32, 5);
    }
  }

  // ── Bridges ───────────────────────────────────────────────────────────────
  private buildBridgesAndDocks(): void {
    const { scene } = this;
    for (const b of VILLAGE.bridges) {
      const texKey = b.orientation === 'horizontal' ? 'bridge-horizontal' : 'bridge-vertical';
      scene.add
        .image(b.x, b.y, texKey)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(b.width, b.height)
        .setDepth(b.y + b.height / 2);
    }
  }

  // ── World boundary walls ───────────────────────────────────────────────────
  private buildWorldBoundaries(
    addBox: (x: number, y: number, w: number, h: number, label: string) => void,
  ): void {
    const W = VILLAGE.width;
    const H = VILLAGE.height;
    const T = 100; // border thickness
    addBox(0, 0, W, T, 'north boundary');
    addBox(0, 0, T, H, 'west boundary');
    addBox(W - T, 0, T, H, 'east boundary');
    // South boundary with opening for spawn entrance
    addBox(0, H - T, 940, T, 'south boundary left');
    addBox(1108, H - T, W - 1108, T, 'south boundary right');
  }

  // ── Water collision blocks ────────────────────────────────────────────────
  private buildWaterCollisions(
    addBox: (x: number, y: number, w: number, h: number, label: string) => void,
  ): void {
    // Pond collision (dock gap at 450, y 1100-1160)
    addBox(280, 1020, 170, 220, 'pond west');
    addBox(500, 1020, 130, 220, 'pond east');
    addBox(410, 1200, 80, 60, 'pond south');

    // Eastern stream (bridge gaps at y 820-880 and y 1150-1210)
    addBox(1840, 100, 100, 700, 'stream north');
    addBox(1840, 900, 100, 220, 'stream mid');
    addBox(1840, 1230, 100, 280, 'stream south');
  }

  // ── Props ─────────────────────────────────────────────────────────────────
  private buildProps(
    addBox: (x: number, y: number, w: number, h: number, label: string) => void,
  ): void {
    const { scene } = this;

    for (const p of VILLAGE.props) {
      switch (p.texture) {
        case 'prop-fountain': {
          const f = scene.add
            .image(p.x, p.y, p.texture)
            .setOrigin(0.5, 0.65)
            .setDepth(p.y);
          scene.tweens.add({
            targets: f, scaleX: 1.02, scaleY: 1.02,
            duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
          if (p.collision) {
            addBox(p.x - p.collision.width / 2, p.y - p.collision.height / 2, p.collision.width, p.collision.height, 'fountain');
          }
          break;
        }
        case 'prop-arch': {
          scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.85).setDepth(p.y);
          addBox(p.x - 48, p.y - 20, 20, 20, 'arch left post');
          addBox(p.x + 28, p.y - 20, 20, 20, 'arch right post');
          break;
        }
        case 'prop-dock': {
          scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.5).setDepth(p.y);
          break;
        }
        case 'prop-boat': {
          scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.5).setDepth(p.y);
          if (p.collision) {
            addBox(p.x - p.collision.width / 2, p.y - p.collision.height / 2, p.collision.width, p.collision.height, 'rowboat');
          }
          break;
        }
        case 'prop-lamp': {
          scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.85).setDepth(p.y);
          // Warm lantern glow
          const glow = scene.add.graphics().setDepth(p.y - 5);
          glow.fillStyle(0xffe699, 0.14);
          glow.fillCircle(p.x, p.y - 28, 34);
          glow.fillStyle(0xfff5cc, 0.24);
          glow.fillCircle(p.x, p.y - 28, 16);
          scene.tweens.add({
            targets: glow, alpha: 0.65,
            duration: 800 + Math.random() * 500,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
          if (p.collision) {
            addBox(p.x - p.collision.width / 2, p.y - p.collision.height, p.collision.width, p.collision.height, 'lamp post');
          }
          break;
        }
        case 'prop-bench': {
          scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.85).setDepth(p.y);
          if (p.collision) {
            addBox(p.x - p.collision.width / 2, p.y - p.collision.height, p.collision.width, p.collision.height, 'bench');
          }
          break;
        }
        case 'prop-fence-h': {
          scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.85).setDepth(p.y);
          if (p.collision) {
            addBox(p.x - p.collision.width / 2, p.y - p.collision.height, p.collision.width, p.collision.height, 'fence');
          }
          break;
        }
        case 'prop-tree-oak':
        case 'prop-tree-pine': {
          scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.88).setDepth(p.y);
          if (p.collision) {
            addBox(p.x - p.collision.width / 2, p.y - p.collision.height, p.collision.width, p.collision.height, 'tree trunk');
          }
          break;
        }
        case 'prop-bush': {
          scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.85).setDepth(p.y);
          if (p.collision) {
            addBox(p.x - p.collision.width / 2, p.y - p.collision.height, p.collision.width, p.collision.height, 'bush');
          }
          break;
        }
        case 'prop-flowerbed': {
          scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.5).setDepth(3);
          break;
        }
        default:
          break;
      }
    }
  }

  // ── Debug overlay ──────────────────────────────────────────────────────────
  private debug(solids: Phaser.Physics.Arcade.StaticGroup): void {
    if (!new URLSearchParams(window.location.search).has('debug')) return;
    const g = this.scene.add.graphics().setDepth(3000).setScrollFactor(1);
    g.lineStyle(3, 0xff4f65, 1).strokeRect(0, 0, VILLAGE.width, VILLAGE.height);
    g.lineStyle(2, 0xf4c75b, 1);
    solids.getChildren().forEach((o) => {
      const r = (o as Phaser.GameObjects.Rectangle).getBounds();
      g.strokeRect(r.x, r.y, r.width, r.height);
    });
    g.fillStyle(0x83d17b, 1).fillCircle(VILLAGE.spawn.x, VILLAGE.spawn.y, 10);
  }
}

export function preloadVillageAssets(scene: Phaser.Scene): void {
  const base = import.meta.env.BASE_URL;

  // Portfolio buildings
  scene.load.image('building-about-me',   `${base}assets/processed/buildings/individual/building-about-me.png`);
  scene.load.image('building-projects',   `${base}assets/processed/buildings/individual/building-projects.png`);
  scene.load.image('building-skills',     `${base}assets/processed/buildings/individual/building-skills.png`);
  scene.load.image('building-guild-hall', `${base}assets/processed/buildings/individual/building-guild-hall.png`);
  scene.load.image('building-services',   `${base}assets/processed/buildings/individual/building-services.png`);
  scene.load.image('building-contact',    `${base}assets/processed/buildings/individual/building-contact.png`);
  scene.load.image('building-house-1',    `${base}assets/processed/buildings/individual/building-house-1.png`);
  scene.load.image('building-house-2',    `${base}assets/processed/buildings/individual/building-house-2.png`);

  // Legacy buildings for backward-compat
  scene.load.image('building-cottage', `${base}assets/processed/buildings/individual/building-1-cottage-green.png`);
  scene.load.image('building-forge',   `${base}assets/processed/buildings/individual/building-2-forge-red.png`);
  scene.load.image('building-hall',    `${base}assets/processed/buildings/individual/building-3-hall-blue.png`);
  scene.load.image('building-house',   `${base}assets/processed/buildings/individual/building-4-house-orange.png`);

  // Props & environment
  scene.load.image('prop-fountain',  `${base}assets/processed/props/fountain.png`);
  scene.load.image('prop-arch',      `${base}assets/processed/props/entrance-arch.png`);
  scene.load.image('prop-dock',      `${base}assets/processed/props/fishing-dock.png`);
  scene.load.image('prop-boat',      `${base}assets/processed/props/rowboat.png`);
  scene.load.image('bridge-horizontal', `${base}assets/processed/props/bridge-horizontal.png`);
  scene.load.image('bridge-vertical',   `${base}assets/processed/props/bridge-vertical.png`);
  scene.load.image('prop-lamp',      `${base}assets/processed/props/streetlamp.png`);
  scene.load.image('prop-bench',     `${base}assets/processed/props/bench.png`);
  scene.load.image('prop-tree-oak',  `${base}assets/processed/props/tree-oak.png`);
  scene.load.image('prop-tree-pine', `${base}assets/processed/props/tree-pine.png`);
  scene.load.image('prop-bush',      `${base}assets/processed/props/bush.png`);
  scene.load.image('prop-fence-h',   `${base}assets/processed/props/fence-h.png`);
  scene.load.image('prop-fence-v',   `${base}assets/processed/props/fence-v.png`);
  scene.load.image('prop-flowerbed', `${base}assets/processed/props/flowerbed.png`);

  // Terrain atlas + player sprite sheet
  scene.load.image('terrain-atlas', `${base}assets/processed/terrain/terrain-tileset-clean-partial.png`);
  scene.load.spritesheet('player-atlas', `${base}assets/processed/player/player-atlas-normalized.png`, {
    frameWidth: 144,
    frameHeight: 176,
  });
}
