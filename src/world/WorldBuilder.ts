import * as Phaser from 'phaser';
import { VILLAGE } from './maps/villageMap';
import { assetUrl } from '../config/assetManifest';

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

    // 1. Base Ground (Lush pixel-art grass with coordinate-seeded variations)
    // Repeat a small grass tile across the world instead of allocating one 4096x3072 texture.
    // Large generated textures can fail on some browser/GPU combinations and expose the navy background.
    scene.add
      .tileSprite(0, 0, VILLAGE.width, VILLAGE.height, 'village-ground')
      .setOrigin(0, 0)
      .setDepth(-10);

    // 2. Water Bodies (River and Southwest Pond)
    this.buildWaterBodies();

    // 3. Dirt Path Network & Cobblestone Plaza
    this.buildPathsAndPlaza();

    // 4. Bridges & Docks
    this.buildBridgesAndDocks();

    // 5. Solid Collision Group
    const solids = scene.physics.add.staticGroup();
    const addBox = (x: number, y: number, w: number, h: number, label: string): void => {
      const obj = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0).setOrigin(0.5).setVisible(false);
      scene.physics.add.existing(obj, true);
      (obj.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h);
      obj.setData('collisionLabel', label);
      solids.add(obj);
    };

    // 6. Perimeter Cliff / Boundary Collisions
    this.buildWorldBoundaries(addBox);

    // 7. Water Collisions (Solid water body colliders with bridge cutouts)
    this.buildWaterCollisions(addBox);

    // 8. Buildings
    const icons: Record<string, string> = {
      about: '📜 ',
      projects: '⚒ ',
      skills: '⚔ ',
      experience: '🛡 ',
      services: '⚖ ',
      contact: '✉ ',
      house1: '🏡 ',
      house2: '🏠 ',
    };

    for (const b of VILLAGE.buildings) {
      const texture = scene.textures.get(b.texture);
      const source = texture.getSourceImage() as HTMLImageElement;
      const sourceWidth = source.width || b.width;
      const sourceHeight = source.height || b.height;
      const fit = Math.min(b.width / sourceWidth, b.height / sourceHeight);
      const displayWidth = sourceWidth * fit;
      const displayHeight = sourceHeight * fit;
      // Preserve the original artwork's aspect ratio and anchor the building to its
      // ground/door edge instead of stretching it into a rectangular panel.
      const sprite = scene.add
        .image(b.x + (b.width - displayWidth) / 2, b.y + b.height - displayHeight, b.texture)
        .setOrigin(0, 0)
        .setDisplaySize(displayWidth, displayHeight)
        .setDepth(b.y + b.height);

      sprite.setData('buildingId', b.id);
      sprite.setData('label', b.label);

      // Add solid wall sections on left and right of doorway
      b.collision.forEach((r, idx) => {
        addBox(r.x, r.y, r.width, r.height, `${b.label} wall ${idx + 1}`);
      });

      // Wooden entrance plaque sign
      const doorY = b.y + b.height - 20;
      const icon = icons[b.id] ?? '✦ ';

      const sign = scene.add
        .text(b.x + b.width / 2, doorY + 6, `${icon}${b.label}`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#fff0cc',
          backgroundColor: '#183d32',
          stroke: '#f2c96d',
          strokeThickness: 2,
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0.5, 0)
        .setDepth(doorY + 15);

      scene.tweens.add({
        targets: sign,
        alpha: 0.88,
        duration: 1800,
        yoyo: true,
        repeat: -1,
      });
    }

    // 9. Props (Fountain, Arch, Lamps, Trees, Fences, Bushes, Flowerbeds)
    this.buildProps(addBox);

    // 10. Plaza Notice Board
    const noticeBoardX = 1950;
    const noticeBoardY = 1560;
    scene.add.image(noticeBoardX, noticeBoardY, 'village-notice-board').setOrigin(0.5, 0.85).setDepth(noticeBoardY);
    addBox(noticeBoardX - 18, noticeBoardY - 24, 36, 24, 'notice board');

    // 11. Stone steps at southern entrance
    scene.add.image(2048, 2780, 'stone-steps').setOrigin(0.5, 0).setDepth(2);

    this.debug(solids);
    return solids;
  }

  private createWorldCanvasTextures(): void {
    const { scene } = this;

    // 1. Seam-safe 128x128 grass tile repeated over the full 4096x3072 world.
    const ground = scene.make.graphics({ x: 0, y: 0 });
    ground.fillGradientStyle(0x5a9e47, 0x5a9e47, 0x4f8e3c, 0x4f8e3c, 1);
    ground.fillRect(0, 0, 128, 128);

    // Deterministic grass details kept away from tile edges to avoid obvious seams.
    for (let y = 8; y < 120; y += 12) {
      for (let x = 8; x < 120; x += 12) {
        const n = (x * 37 + y * 53) % 17;
        if (n < 5) {
          ground.fillStyle(n === 0 ? 0x447d33 : 0x6bb354, 0.55);
          ground.fillRect(x, y, 3, 2);
          ground.fillRect(x + 1, y - 2, 2, 2);
        } else if (n === 7) {
          ground.fillStyle(0xf7e879, 0.55);
          ground.fillRect(x + 2, y + 2, 2, 2);
        }
      }
    }
    ground.generateTexture('village-ground', 128, 128);
    ground.destroy();

    // 2. Notice board texture
    const nb = scene.make.graphics({ x: 0, y: 0 });
    nb.fillStyle(0x563820).fillRect(6, 18, 5, 20).fillRect(25, 18, 5, 20);
    nb.fillStyle(0x69402f).fillRect(2, 2, 32, 22);
    nb.lineStyle(2, 0x3d2516, 1).strokeRect(2, 2, 32, 22);
    nb.fillStyle(0xf5ebd2).fillRect(6, 5, 24, 16);
    nb.fillStyle(0x26332c, 0.7).fillRect(9, 8, 18, 2).fillRect(9, 13, 14, 2);
    nb.fillStyle(0xe85d5d).fillCircle(18, 5, 2);
    nb.generateTexture('village-notice-board', 36, 42);
    nb.destroy();

    // 3. Stone steps texture
    const st = scene.make.graphics({ x: 0, y: 0 });
    st.fillStyle(0x8a9199).fillRect(0, 0, 160, 20);
    st.fillStyle(0x767d84).fillRect(10, 20, 140, 20);
    st.fillStyle(0x62686e).fillRect(20, 40, 120, 20);
    st.fillStyle(0x4e5359).fillRect(30, 60, 100, 20);
    st.generateTexture('stone-steps', 160, 80);
    st.destroy();
  }

  private buildWaterBodies(): void {
    const { scene } = this;
    const waterGfx = scene.add.graphics().setDepth(2);

    // A. Southwest Tranquil Pond
    // Deep turquoise pond base
    waterGfx.fillStyle(0x1a8791, 0.95);
    waterGfx.fillEllipse(950, 2300, 680, 440);
    // Inner vibrant turquoise shimmer
    waterGfx.fillStyle(0x2cb8aa, 0.85);
    waterGfx.fillEllipse(950, 2300, 600, 380);
    // Pond bank ring
    waterGfx.lineStyle(12, 0x3c7042, 0.7);
    waterGfx.strokeEllipse(950, 2300, 692, 452);

    // B. Eastern River
    // River body flowing smoothly from NE to SE
    waterGfx.fillStyle(0x1a8791, 0.95);
    waterGfx.beginPath();
    waterGfx.moveTo(3360, 0);
    waterGfx.lineTo(3600, 0);
    waterGfx.lineTo(3580, 600);
    waterGfx.lineTo(3520, 1200);
    waterGfx.lineTo(3480, 1800);
    waterGfx.lineTo(3440, 2400);
    waterGfx.lineTo(3560, 3072);
    waterGfx.lineTo(3320, 3072);
    waterGfx.lineTo(3220, 2400);
    waterGfx.lineTo(3260, 1800);
    waterGfx.lineTo(3300, 1200);
    waterGfx.lineTo(3360, 600);
    waterGfx.closePath();
    waterGfx.fillPath();

    // Inner bright turquoise ribbon
    waterGfx.fillStyle(0x2cb8aa, 0.85);
    waterGfx.beginPath();
    waterGfx.moveTo(3390, 0);
    waterGfx.lineTo(3570, 0);
    waterGfx.lineTo(3540, 600);
    waterGfx.lineTo(3480, 1200);
    waterGfx.lineTo(3440, 1800);
    waterGfx.lineTo(3400, 2400);
    waterGfx.lineTo(3520, 3072);
    waterGfx.lineTo(3360, 3072);
    waterGfx.lineTo(3260, 2400);
    waterGfx.lineTo(3300, 1800);
    waterGfx.lineTo(3340, 1200);
    waterGfx.lineTo(3400, 600);
    waterGfx.closePath();
    waterGfx.fillPath();

    // Natural river banks
    waterGfx.lineStyle(14, 0x3c7042, 0.65);
    waterGfx.strokePath();

    // C. Animated Water Surface Ripples (glistening highlights)
    const ripples = scene.add.graphics().setDepth(2.5);
    const drawRipples = (): void => {
      ripples.clear();
      ripples.lineStyle(3, 0x76ecdc, 0.75);

      // Pond ripples
      for (const [rx, ry, rw] of [
        [800, 2220, 48], [920, 2180, 64], [1080, 2240, 56],
        [880, 2340, 60], [1020, 2380, 52], [760, 2300, 44],
        [940, 2420, 68], [1120, 2320, 46],
      ]) {
        ripples.beginPath();
        ripples.moveTo(rx - rw / 2, ry);
        ripples.lineTo(rx + rw / 2, ry);
        ripples.strokePath();
      }

      // River ripples along the flow
      for (const [rx, ry, rw] of [
        [3460, 250, 60], [3480, 400, 55], [3440, 750, 65],
        [3400, 1000, 58], [3380, 1250, 62], [3370, 1550, 66],
        [3350, 1900, 58], [3330, 2200, 64], [3380, 2650, 62],
        [3420, 2900, 68],
      ]) {
        ripples.beginPath();
        ripples.moveTo(rx - rw / 2, ry);
        ripples.lineTo(rx + rw / 2, ry);
        ripples.strokePath();
      }
    };
    drawRipples();

    // Shimmering water ripple oscillation
    scene.tweens.add({
      targets: ripples,
      alpha: 0.35,
      y: 4,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // D. Waterfalls
    // Northeast waterfall
    const neFall = scene.add.graphics().setDepth(3);
    neFall.fillStyle(0x76ecdc, 0.95);
    neFall.fillRect(3440, 0, 80, 140);
    neFall.fillStyle(0xffffff, 0.9);
    neFall.fillRect(3448, 120, 64, 25);
    scene.tweens.add({
      targets: neFall,
      alpha: 0.75,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    // Southwest waterfall
    const swFall = scene.add.graphics().setDepth(3);
    swFall.fillStyle(0x76ecdc, 0.95);
    swFall.fillRect(490, 2220, 80, 90);
    swFall.fillStyle(0xffffff, 0.9);
    swFall.fillRect(540, 2290, 60, 24);
    scene.tweens.add({
      targets: swFall,
      alpha: 0.75,
      duration: 450,
      yoyo: true,
      repeat: -1,
    });
  }

  private buildPathsAndPlaza(): void {
    const { scene } = this;
    const paths = scene.add.graphics().setDepth(1);

    // Warm dirt path base border
    paths.lineStyle(48, 0x9b7a54, 1);
    for (const route of VILLAGE.paths) {
      const start = route[0];
      if (!start || route.length < 2) continue;
      paths.beginPath();
      paths.moveTo(start.x, start.y);
      route.slice(1).forEach((p) => paths.lineTo(p.x, p.y));
      paths.strokePath();
    }

    // Golden dirt path surface
    paths.lineStyle(38, 0xd9be8e, 1);
    for (const route of VILLAGE.paths) {
      const start = route[0];
      if (!start || route.length < 2) continue;
      paths.beginPath();
      paths.moveTo(start.x, start.y);
      route.slice(1).forEach((p) => paths.lineTo(p.x, p.y));
      paths.strokePath();
    }

    // Plaza Circle & Cobblestone Ring
    // Outer stone ring
    paths.fillStyle(0x94826d, 1);
    paths.fillCircle(2048, 1440, 172);
    // Cobblestone plaza surface
    paths.fillStyle(0xd9be8e, 1);
    paths.fillCircle(2048, 1440, 158);
    // Cobblestone paver details
    paths.lineStyle(2, 0xbda275, 0.6);
    paths.strokeCircle(2048, 1440, 118);
    paths.strokeCircle(2048, 1440, 78);

    // Southern spawn circle
    paths.fillStyle(0xd9be8e, 1);
    paths.fillCircle(VILLAGE.spawn.x, VILLAGE.spawn.y, 48);
  }

  private buildBridgesAndDocks(): void {
    const { scene } = this;

    // Bridges crossing the river
    for (const b of VILLAGE.bridges) {
      const bridgeTexture = b.orientation === 'horizontal' ? 'bridge-horizontal' : 'bridge-vertical';
      scene.add
        .image(b.x, b.y, bridgeTexture)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(b.width, b.height)
        .setDepth(b.y + b.height / 2);
    }
  }

  private buildWorldBoundaries(addBox: (x: number, y: number, w: number, h: number, label: string) => void): void {
    // Top border
    addBox(0, 0, VILLAGE.width, 140, 'north boundary cliff');
    // Left border
    addBox(0, 0, 140, VILLAGE.height, 'west boundary cliff');
    // Right border
    addBox(VILLAGE.width - 140, 0, 140, VILLAGE.height, 'east boundary cliff');
    // Bottom border with opening at spawn entrance (x: 1960 to 2136)
    addBox(0, VILLAGE.height - 120, 1940, 120, 'south boundary left');
    addBox(2156, VILLAGE.height - 120, VILLAGE.width - 2156, 120, 'south boundary right');
  }

  private buildWaterCollisions(addBox: (x: number, y: number, w: number, h: number, label: string) => void): void {
    // Southwest pond water collision (dock at x: 1000, y: 2220 is walkable)
    addBox(640, 2120, 320, 360, 'pond water west');
    addBox(1050, 2120, 240, 360, 'pond water east');
    addBox(960, 2280, 90, 200, 'pond water south of dock');

    // Eastern river water collision blocks between the 3 bridges
    // Section 1: Above NE bridge (y: 0 to 460)
    addBox(3340, 140, 220, 320, 'river water north');
    // Section 2: Between NE bridge and East bridge (y: 540 to 1340)
    addBox(3280, 540, 240, 800, 'river water upper');
    // Section 3: Between East bridge and SE bridge (y: 1420 to 2370)
    addBox(3240, 1420, 230, 950, 'river water middle');
    // Section 4: Below SE bridge (y: 2530 to 2950)
    addBox(3220, 2530, 230, 420, 'river water south');
  }

  private buildProps(addBox: (x: number, y: number, w: number, h: number, label: string) => void): void {
    const { scene } = this;

    for (const p of VILLAGE.props) {
      if (p.texture === 'prop-fountain') {
        const f = scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.65).setDepth(p.y);
        // Fountain gentle water pulsing effect
        scene.tweens.add({
          targets: f,
          scaleX: 1.02,
          scaleY: 1.02,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        if (p.collision) {
          addBox(p.x - p.collision.width / 2, p.y - p.collision.height / 2, p.collision.width, p.collision.height, 'fountain');
        }
      } else if (p.texture === 'prop-arch') {
        scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.85).setDepth(p.y);
        // Posts on left and right leave center walkable
        addBox(p.x - 56, p.y - 20, 24, 24, 'entrance arch left post');
        addBox(p.x + 32, p.y - 20, 24, 24, 'entrance arch right post');
      } else if (p.texture === 'prop-dock') {
        scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.5).setDepth(p.y);
      } else if (p.texture === 'prop-boat') {
        scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.5).setDepth(p.y);
        if (p.collision) {
          addBox(p.x - p.collision.width / 2, p.y - p.collision.height / 2, p.collision.width, p.collision.height, 'rowboat');
        }
      } else if (p.texture === 'prop-lamp') {
        scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.85).setDepth(p.y);
        // Warm radial lantern glow
        const glow = scene.add.graphics().setDepth(p.y - 5);
        glow.fillStyle(0xffe699, 0.16);
        glow.fillCircle(p.x, p.y - 36, 42);
        glow.fillStyle(0xfff5cc, 0.28);
        glow.fillCircle(p.x, p.y - 36, 22);

        scene.tweens.add({
          targets: glow,
          alpha: 0.75,
          duration: 900 + Math.random() * 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        if (p.collision) {
          addBox(p.x - p.collision.width / 2, p.y - p.collision.height, p.collision.width, p.collision.height, 'streetlamp post');
        }
      } else if (p.texture === 'prop-bench') {
        scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.85).setDepth(p.y);
        if (p.collision) {
          addBox(p.x - p.collision.width / 2, p.y - p.collision.height, p.collision.width, p.collision.height, 'bench');
        }
      } else if (p.texture === 'prop-fence-h') {
        scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.85).setDepth(p.y);
        if (p.collision) {
          addBox(p.x - p.collision.width / 2, p.y - p.collision.height, p.collision.width, p.collision.height, 'fence');
        }
      } else if (p.texture === 'prop-tree-oak' || p.texture === 'prop-tree-pine') {
        scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.88).setDepth(p.y);
        if (p.collision) {
          addBox(p.x - p.collision.width / 2, p.y - p.collision.height, p.collision.width, p.collision.height, 'tree trunk');
        }
      } else if (p.texture === 'prop-bush') {
        scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.85).setDepth(p.y);
        if (p.collision) {
          addBox(p.x - p.collision.width / 2, p.y - p.collision.height, p.collision.width, p.collision.height, 'bush');
        }
      } else if (p.texture === 'prop-flowerbed') {
        scene.add.image(p.x, p.y, p.texture).setOrigin(0.5, 0.5).setDepth(3);
      }
    }
  }

  private debug(solids: Phaser.Physics.Arcade.StaticGroup): void {
    if (!new URLSearchParams(window.location.search).has('debug')) return;
    const g = this.scene.add.graphics().setDepth(3000).setScrollFactor(1);
    g.lineStyle(3, 0xff4f65, 1).strokeRect(0, 0, VILLAGE.width, VILLAGE.height);
    g.lineStyle(2, 0xf4c75b, 1);
    solids.getChildren().forEach((o) => {
      const r = (o as Phaser.GameObjects.Rectangle).getBounds();
      g.strokeRect(r.x, r.y, r.width, r.height);
    });
    g.fillStyle(0x83d17b, 1).fillCircle(VILLAGE.spawn.x, VILLAGE.spawn.y, 12);
  }
}

export function preloadVillageAssets(scene: Phaser.Scene): void {
  const base = import.meta.env.BASE_URL;

  // 1. All 8 Buildings
  scene.load.image('building-about-me', `${base}assets/processed/buildings/individual/building-about-me.png`);
  scene.load.image('building-projects', `${base}assets/processed/buildings/individual/building-projects.png`);
  scene.load.image('building-skills', `${base}assets/processed/buildings/individual/building-skills.png`);
  scene.load.image('building-guild-hall', `${base}assets/processed/buildings/individual/building-guild-hall.png`);
  scene.load.image('building-services', `${base}assets/processed/buildings/individual/building-services.png`);
  scene.load.image('building-contact', `${base}assets/processed/buildings/individual/building-contact.png`);
  scene.load.image('building-house-1', `${base}assets/processed/buildings/individual/building-house-1.png`);
  scene.load.image('building-house-2', `${base}assets/processed/buildings/individual/building-house-2.png`);

  // Legacy buildings for backward compatibility
  scene.load.image('building-cottage', `${base}assets/processed/buildings/individual/building-1-cottage-green.png`);
  scene.load.image('building-forge', `${base}assets/processed/buildings/individual/building-2-forge-red.png`);
  scene.load.image('building-hall', `${base}assets/processed/buildings/individual/building-3-hall-blue.png`);
  scene.load.image('building-house', `${base}assets/processed/buildings/individual/building-4-house-orange.png`);

  // 2. Village Props & Environmental Landmarks
  scene.load.image('prop-fountain', `${base}assets/processed/props/fountain.png`);
  scene.load.image('prop-arch', `${base}assets/processed/props/entrance-arch.png`);
  scene.load.image('prop-dock', `${base}assets/processed/props/fishing-dock.png`);
  scene.load.image('prop-boat', `${base}assets/processed/props/rowboat.png`);
  scene.load.image('bridge-horizontal', `${base}assets/processed/props/bridge-horizontal.png`);
  scene.load.image('bridge-vertical', `${base}assets/processed/props/bridge-vertical.png`);
  scene.load.image('prop-lamp', `${base}assets/processed/props/streetlamp.png`);
  scene.load.image('prop-bench', `${base}assets/processed/props/bench.png`);
  scene.load.image('prop-tree-oak', `${base}assets/processed/props/tree-oak.png`);
  scene.load.image('prop-tree-pine', `${base}assets/processed/props/tree-pine.png`);
  scene.load.image('prop-bush', `${base}assets/processed/props/bush.png`);
  scene.load.image('prop-fence-h', `${base}assets/processed/props/fence-h.png`);
  scene.load.image('prop-fence-v', `${base}assets/processed/props/fence-v.png`);
  scene.load.image('prop-flowerbed', `${base}assets/processed/props/flowerbed.png`);

  // 3. Terrain & Player Atlas
  scene.load.image('terrain-atlas', `${base}assets/processed/terrain/terrain-tileset-clean-partial.png`);
  scene.load.spritesheet('player-atlas', `${base}assets/processed/player/player-atlas-normalized.png`, {
    frameWidth: 144,
    frameHeight: 176,
  });
}
