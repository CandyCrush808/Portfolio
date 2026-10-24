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

    // Use the supplied pixel-art terrain atlas for the actual ground, paths and water.
    // No procedural/vector ground colours: the scene is composed from the audited image assets.
    this.registerTerrainFrames();
    this.buildTerrainGround();

    // 2. Water Bodies built from the real terrain atlas tiles.
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

    // Small utility sprites that do not exist in the supplied art pack.
    // The terrain, path, water, buildings and environmental props all use image assets.
    const nb = scene.make.graphics({ x: 0, y: 0 });
    nb.fillStyle(0x563820).fillRect(6, 18, 5, 20).fillRect(25, 18, 5, 20);
    nb.fillStyle(0x69402f).fillRect(2, 2, 32, 22);
    nb.lineStyle(2, 0x3d2516, 1).strokeRect(2, 2, 32, 22);
    nb.fillStyle(0xf5ebd2).fillRect(6, 5, 24, 16);
    nb.fillStyle(0x26332c, 0.7).fillRect(9, 8, 18, 2).fillRect(9, 13, 14, 2);
    nb.fillStyle(0xe85d5d).fillCircle(18, 5, 2);
    nb.generateTexture('village-notice-board', 36, 42);
    nb.destroy();

    const st = scene.make.graphics({ x: 0, y: 0 });
    st.fillStyle(0x8a9199).fillRect(0, 0, 160, 20);
    st.fillStyle(0x767d84).fillRect(10, 20, 140, 20);
    st.fillStyle(0x62686e).fillRect(20, 40, 120, 20);
    st.fillStyle(0x4e5359).fillRect(30, 60, 100, 20);
    st.generateTexture('stone-steps', 160, 80);
    st.destroy();
  }

  private registerTerrainFrames(): void {
    const atlas = this.scene.textures.get('terrain-atlas');
    const frames = [
      ['terrain-grass', 0, 0, 72, 77],
      ['terrain-grass-2', 237, 0, 70, 77],
      ['terrain-grass-3', 474, 0, 71, 77],
      ['terrain-dirt', 238, 81, 69, 73],
      ['terrain-cobble', 3, 158, 65, 69],
      ['terrain-water', 0, 309, 67, 68],
      ['terrain-water-2', 85, 309, 62, 69],
      ['terrain-water-edge', 0, 385, 73, 74],
      ['terrain-water-edge-2', 245, 385, 62, 74],
      ['terrain-vegetation', 242, 699, 57, 60],
    ] as const;
    for (const [key, x, y, width, height] of frames) {
      if (!atlas.has(key)) atlas.add(key, 0, x, y, width, height);
    }
  }

  private buildTerrainGround(): void {
    const { scene } = this;
    // One repeating, real grass tile keeps draw calls low on the 4096x3072 world.
    scene.add.tileSprite(0, 0, VILLAGE.width, VILLAGE.height, 'terrain-atlas', 'terrain-grass')
      .setOrigin(0, 0)
      .setDepth(-20);

    // Lightly vary the grass using other supplied grass/vegetation frames so the
    // world does not look like a flat procedural colour field.
    let seed = 37;
    const rand = (): number => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 220; i += 1) {
      const x = 170 + rand() * (VILLAGE.width - 340);
      const y = 170 + rand() * (VILLAGE.height - 340);
      const key = rand() > 0.55 ? 'terrain-grass-2' : 'terrain-grass-3';
      scene.add.image(x, y, 'terrain-atlas', key)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(48, 52)
        .setAlpha(0.35 + rand() * 0.3)
        .setDepth(-19);
    }
  }

  private buildWaterBodies(): void {
    const { scene } = this;
    const tile = (x: number, y: number, frame: string, size = 70, depth = 0): void => {
      scene.add.image(x, y, 'terrain-atlas', frame)
        .setDisplaySize(size, size)
        .setOrigin(0.5, 0.5)
        .setDepth(depth);
    };

    // Southwest pond assembled from the supplied water and water-edge tiles.
    for (let y = 2070; y <= 2500; y += 58) {
      for (let x = 660; x <= 1300; x += 58) {
        const nx = (x - 980) / 330;
        const ny = (y - 2290) / 220;
        const distance = nx * nx + ny * ny;
        if (distance <= 1.08) {
          const frame = ((Math.floor(x / 58) + Math.floor(y / 58)) % 3 === 0)
            ? 'terrain-water-2' : 'terrain-water';
          tile(x, y, frame, 46, 1);
        } else if (distance <= 1.35 && (Math.floor(x / 58) + Math.floor(y / 58)) % 2 === 0) {
          tile(x, y, 'terrain-water-edge', 48, 1.5);
        }
      }
    }

    // Eastern river follows a soft meander, using image tiles rather than vector fills.
    for (let y = 10; y < VILLAGE.height; y += 58) {
      const centerX = 3420 + Math.sin(y / 390) * 85 + Math.sin(y / 170) * 22;
      for (let x = centerX - 145; x <= centerX + 145; x += 58) {
        const edge = Math.abs(x - centerX) > 108;
        const frame = edge
          ? (((Math.floor(y / 58) + Math.floor(x / 58)) % 2 === 0) ? 'terrain-water-edge' : 'terrain-water-edge-2')
          : (((Math.floor(y / 58) + Math.floor(x / 58)) % 3 === 0) ? 'terrain-water-2' : 'terrain-water');
        tile(x, y, frame, 46, edge ? 1.5 : 1);
      }
    }

    // Waterfall accents made from the same terrain-water artwork.
    for (let i = 0; i < 4; i += 1) {
      tile(3480 + i * 14, 58 + i * 34, i % 2 ? 'terrain-water-edge' : 'terrain-water', 46, 3);
    }
    for (let i = 0; i < 3; i += 1) {
      tile(535 + i * 18, 2250 + i * 26, i % 2 ? 'terrain-water-edge' : 'terrain-water', 44, 3);
    }
  }

  private buildPathsAndPlaza(): void {
    const { scene } = this;
    const stamp = (x: number, y: number, frame: string, size = 68, depth = 4, angle = 0): void => {
      scene.add.image(x, y, 'terrain-atlas', frame)
        .setDisplaySize(size, size)
        .setRotation(angle)
        .setOrigin(0.5, 0.5)
        .setDepth(depth);
    };

    // Place real dirt tiles along every route so the paths are part of the art,
    // not vector strokes. The short step distance makes routes visually connected.
    for (const route of VILLAGE.paths) {
      for (let i = 0; i < route.length - 1; i += 1) {
        const a = route[i];
        const b = route[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(distance / 30));
        const angle = Math.atan2(dy, dx) * 0.08;
        for (let step = 0; step <= steps; step += 1) {
          const t = step / steps;
          stamp(a.x + dx * t, a.y + dy * t, 'terrain-dirt', 48, 4, angle);
        }
      }
    }

    // Central village plaza made from the provided cobblestone tile.
    for (let y = 1310; y <= 1570; y += 42) {
      for (let x = 1880; x <= 2216; x += 42) {
        const dx = (x - 2048) / 178;
        const dy = (y - 1440) / 140;
        if (dx * dx + dy * dy <= 1.12) stamp(x, y, 'terrain-cobble', 42, 5);
      }
    }

    // Cobblestone arrival pad at the southern entrance.
    for (let y = 2710; y <= 2790; y += 36) {
      for (let x = 1950; x <= 2146; x += 36) stamp(x, y, 'terrain-cobble', 38, 5);
    }
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
