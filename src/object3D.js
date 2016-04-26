import { mat4 } from 'gl-matrix';

import Transform from './transform';

export default class Object3D {
  constructor() {
    this.transform = new Transform();
    this.globalMatrix = mat4.create();
    this.hasChanged = false;
  }
  validate() {
    return this.transform.validate();
  }
  update(context, parent) {
    this.hasChanged = this.validate();
    // Parent should call children's update function after updating its
    // components, without ticking valid variable.
    if (this.hasChanged || (parent && parent.hasChanged)) {
      // Recalculate global matrix...
      if (parent) {
        mat4.multiply(this.globalMatrix, parent.globalMatrix, this.transform);
      } else {
        mat4.copy(this.globalMatrix, this.transform);
      }
    }
  }
}
