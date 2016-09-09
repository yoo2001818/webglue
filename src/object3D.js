// import { mat4 } from 'gl-matrix';
import Transform from './transform';

export default class Object3D {
  constructor() {
    this.transform = new Transform();
    // this.globalMatrix = mat4.create();
    this.hasChanged = false;
  }
}
