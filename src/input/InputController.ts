import Phaser from 'phaser';
import { KeyboardInput } from './KeyboardInput';
import { TouchControls } from './TouchControls';

/** Combines keyboard and touch vectors, then normalizes diagonals once. */
export class InputController {
  private readonly keyboard:KeyboardInput;
  private readonly touch:TouchControls;
  private readonly keyboardVector=new Phaser.Math.Vector2();
  private readonly touchVector=new Phaser.Math.Vector2();
  private readonly movement=new Phaser.Math.Vector2();

  constructor(scene:Phaser.Scene){this.keyboard=new KeyboardInput(scene);this.touch=new TouchControls(scene);}

  getMovement():Phaser.Math.Vector2{
    this.keyboard.getVector(this.keyboardVector);this.touch.getVector(this.touchVector);
    this.movement.set(this.keyboardVector.x+this.touchVector.x,this.keyboardVector.y+this.touchVector.y);
    return this.movement.lengthSq()>1?this.movement.normalize():this.movement;
  }

  destroy():void{this.keyboard.destroy();this.touch.destroy();}
}
