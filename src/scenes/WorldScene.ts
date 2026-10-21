import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants';
import { eventBus, GameEvents } from '../core/EventBus';
import { PlayerController } from '../entities/PlayerController';
import { InputController } from '../input/InputController';
import { WorldBuilder } from '../world/WorldBuilder';
import { VILLAGE } from '../world/maps/villageMap';

/**
 * Village world, player movement, and collision scene. Portfolio interactions
 * remain a later roadmap phase.
 */
export class WorldScene extends Phaser.Scene {
  private player!: PlayerController;
  private inputController!: InputController;
  private debugBody?: Phaser.GameObjects.Graphics;
  private debugLabel?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.WORLD);
  }

  create(): void {
    const blockers = new WorldBuilder(this).build();
    this.physics.world.setBounds(0, 0, VILLAGE.width, VILLAGE.height);
    this.player = new PlayerController(this, VILLAGE.spawn);
    this.physics.add.collider(this.player, blockers);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, VILLAGE.width, VILLAGE.height);
    // Keep the canvas full-screen while zooming the camera out so every world
    // element (player, buildings, trees, paths and props) appears smaller together.
    const getWorldZoom = (): number => {
      if (window.innerWidth <= 700) return 0.42;
      if (window.innerHeight <= 520) return 0.46;
      return 0.50;
    };
    camera.setZoom(getWorldZoom());
    camera.startFollow(this.player, true);
    camera.roundPixels = true;
    const updateWorldZoom = (): void => camera.setZoom(getWorldZoom());
    window.addEventListener('resize', updateWorldZoom);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('resize', updateWorldZoom);
    });

    this.inputController = new InputController(this);
    if(new URLSearchParams(window.location.search).has('debug')){
      this.debugBody=this.add.graphics().setDepth(5000);
      this.debugLabel=this.add.text(8,8,'',{fontSize:'12px',color:'#fff0cc',backgroundColor:'#17172F',padding:{x:5,y:4}}).setScrollFactor(0).setDepth(5001);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputController.destroy());

    eventBus.emit(GameEvents.GAME_READY);
  }

  update(): void {
    this.player.updateMovement(this.inputController.getMovement());
    if(this.debugBody&&this.debugLabel){
      const body=this.player.body as Phaser.Physics.Arcade.Body;
      const foot=this.player.footPoint;
      this.debugBody.clear().lineStyle(2,0xff4f65,1).strokeRect(body.x,body.y,body.width,body.height)
        .fillStyle(0x83d17b,1).fillCircle(foot.x,foot.y,3);
      this.debugLabel.setText(`Facing: ${this.player.facing} | ${this.player.isMoving?'walking':'idle'}`);
    }
  }
}
