import * as Phaser from 'phaser';
import { VILLAGE } from './maps/villageMap';
import { ASSET_CATALOG, assetUrl } from '../config/assetManifest';

export const WORLD_REQUIRED_TEXTURES = [
  'terrain-atlas','building-cottage','building-forge','building-hall','building-house','player-atlas',
] as const;

export class WorldBuilder {
  constructor(private readonly scene: Phaser.Scene) {}

  build(): Phaser.Physics.Arcade.StaticGroup {
    const { scene } = this;
    this.makeNatureTextures();
    const ground = scene.make.graphics({ x: 0, y: 0 });
    ground.fillGradientStyle(0x77b85b, 0x77b85b, 0x6daa50, 0x6daa50, 1);
    ground.fillRect(0, 0, VILLAGE.width, VILLAGE.height);
    // Subtle orderly ground variation, seeded by coordinates for a stable map.
    for (let y = 20; y < VILLAGE.height; y += 37) for (let x = 16; x < VILLAGE.width; x += 43) {
      const n = (x * 17 + y * 31) % 11;
      if (n < 3) { ground.fillStyle(n === 0 ? 0x639c49 : 0x83c363, 0.38); ground.fillRect(x, y, 3, 2); }
    }
    ground.generateTexture('village-ground', VILLAGE.width, VILLAGE.height); ground.destroy();
    scene.add.image(0, 0, 'village-ground').setOrigin(0).setDepth(0);
    const atlas = scene.textures.get('terrain-atlas');
    const waterRects = [[0,309,67,68],[85,309,62,69],[165,309,61,68],[239,309,64,68],[321,309,65,68],[635,309,66,69]];
    waterRects.forEach(([x,y,w,h],i)=>atlas.add(`water-${i}`,0,x!,y!,w!,h!));
    const water = VILLAGE.pond;
    waterRects.forEach((_,i)=>{
      const col=i%water.columns,row=Math.floor(i/water.columns);
      scene.add.image(water.x+col*water.tileWidth,water.y+row*water.tileHeight,`water-${i}`).setOrigin(0).setDepth(1.5);
    });

    // Paths are a connected hand-drawn network. Rounded caps keep junctions continuous.
    const paths = scene.add.graphics().setDepth(1);
    paths.lineStyle(72, 0x967957, 1); paths.lineStyle(64, 0xc2a77f, 1);
    for (const route of VILLAGE.paths) {
      const start = route[0];
      if (!start || route.length < 2) continue;
      paths.beginPath(); paths.moveTo(start.x, start.y);
      route.slice(1).forEach(p => paths.lineTo(p.x, p.y)); paths.strokePath();
    }
    // Spawn plaza.
    paths.fillStyle(0xc2a77f, 1); paths.fillCircle(VILLAGE.spawn.x, VILLAGE.spawn.y, 66);

    const solids = scene.physics.add.staticGroup();
    const box = (x:number,y:number,w:number,h:number,label:string):void => {
      const obj = scene.add.rectangle(x+w/2,y+h/2,w,h,0x000000,0).setOrigin(.5).setVisible(false);
      scene.physics.add.existing(obj, true); (obj.body as Phaser.Physics.Arcade.StaticBody).setSize(w,h);
      obj.setData('collisionLabel',label); solids.add(obj);
    };
    for (const b of VILLAGE.buildings) {
      const sprite = scene.add.image(b.x,b.y,b.texture).setOrigin(0,0).setDisplaySize(b.width,b.height).setDepth(b.y+b.height);
      sprite.setData('buildingId',b.id); sprite.setData('label',b.label);
      b.collision.forEach((r,index)=>box(r.x,r.y,r.width,r.height,`${b.label} wall ${index+1}`));
      const doorY=Math.max(...b.collision.map(r=>r.y+r.height));
      scene.add.text(b.x+b.width/2,doorY+10,b.label,{
        fontFamily:'sans-serif',fontSize:'14px',color:'#fff0cc',backgroundColor:'#69402F',padding:{x:5,y:3},
      }).setOrigin(.5,0).setDepth(doorY+12);
    }
    box(water.x+8,water.y+8,water.columns*water.tileWidth-16,water.rows*water.tileHeight-16,'pond water');
    for (const p of VILLAGE.props) {
      if (p.texture === 'tree') {
        scene.add.image(p.x,p.y,'village-tree').setOrigin(.5,.85).setDepth(p.y);
        if (p.collision) box(p.x-p.collision.width/2,p.y-p.collision.height,p.collision.width,p.collision.height,'tree trunk');
      } else scene.add.image(p.x,p.y,'village-flower').setOrigin(.5,.5).setDepth(2);
    }

    // Reserved workshop site is marked with a small sign; uncertain building art stays unused.
    scene.add.text(1354, 530, 'Workshop site', { fontFamily:'sans-serif', fontSize:'14px', color:'#fff0cc', backgroundColor:'#69402F', padding:{x:6,y:4} }).setOrigin(.5).setDepth(1100);
    this.debug(solids);
    return solids;
  }

  private makeNatureTextures(): void {
    const tree = this.scene.make.graphics({x:0,y:0});
    tree.fillStyle(0x4b793b).fillEllipse(24,29,42,32);
    tree.fillStyle(0x679d48).fillEllipse(19,20,31,27).fillEllipse(34,20,25,25);
    tree.fillStyle(0x805635).fillRect(20,36,8,20);
    tree.generateTexture('village-tree',48,56); tree.destroy();
    const flower = this.scene.make.graphics({x:0,y:0});
    flower.fillStyle(0x4b793b).fillRect(7,9,2,8); flower.fillStyle(0xf3d26a).fillCircle(8,7,3);
    flower.fillStyle(0xe58b92).fillCircle(4,7,2).fillCircle(12,7,2);
    flower.generateTexture('village-flower',16,18); flower.destroy();
  }

  private debug(solids: Phaser.Physics.Arcade.StaticGroup): void {
    if (!new URLSearchParams(window.location.search).has('debug')) return;
    const g = this.scene.add.graphics().setDepth(3000).setScrollFactor(1);
    g.lineStyle(3,0xff4f65,1).strokeRect(0,0,VILLAGE.width,VILLAGE.height);
    g.lineStyle(2,0xf4c75b,1);
    solids.getChildren().forEach(o => { const r=(o as Phaser.GameObjects.Rectangle).getBounds(); g.strokeRect(r.x,r.y,r.width,r.height); });
    g.fillStyle(0x83d17b,1).fillCircle(VILLAGE.spawn.x,VILLAGE.spawn.y,9);
    VILLAGE.pointsOfInterest.forEach(p=>{g.fillStyle(0x69b8f0,1).fillCircle(p.x,p.y,6);this.scene.add.text(p.x,p.y-16,p.label,{fontSize:'12px',color:'#ffffff',backgroundColor:'#17172F'}).setOrigin(.5).setDepth(3001);});
  }
}

export function preloadVillageAssets(scene: Phaser.Scene): void {
  const loadImage=(textureKey:string,catalogKey:string):void=>{
    const asset=ASSET_CATALOG.find(entry=>entry.key===catalogKey);
    if(!asset)throw new Error(`World asset manifest is missing "${catalogKey}"`);
    scene.load.image(textureKey,assetUrl(asset.path));
  };
  loadImage('terrain-atlas','terrain-tileset');
  loadImage('building-cottage','building-1-cottage-green');
  loadImage('building-forge','building-2-forge-red');
  loadImage('building-hall','building-3-hall-blue');
  loadImage('building-house','building-4-house-orange');
  const player=ASSET_CATALOG.find(entry=>entry.key==='player-atlas-normalized');
  if(!player)throw new Error('World asset manifest is missing "player-atlas-normalized"');
  scene.load.spritesheet('player-atlas',assetUrl(player.path),{frameWidth:144,frameHeight:176});
  // Small vegetation decorations are drawn in code because the extracted vegetation band
  // contains uncertain checker pixels; the tree silhouette is deliberately simple.
}
