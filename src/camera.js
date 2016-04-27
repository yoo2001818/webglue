import { mat4 } from 'gl-matrix';

import Object3D from './object3D';

export default class Camera extends Object3D {
  constructor() {
    super();
    this.type = 'persp';
    this.aspect = 1;
    this.near = 0.03;
    this.far = 1000;
    this.fov = Math.PI / 180 * 70;
    this.valid = false;
    this.projectMatrix = mat4.create();
    this.inverseMatrix = mat4.create();
    this.pvMatrix = mat4.create();
  }
  validate() {
    let hasChanged = !this.valid || super.validate();
    if (!this.valid) {
      if (this.type === 'ortho') {
        mat4.orthographic(this.projectMatrix, -this.aspect, this.aspect, -1, 1,
          this.near, this.far);
      } else {
        mat4.perspective(this.projectMatrix, this.fov, this.aspect,
          this.near, this.far);
      }
      this.valid = true;
    }
    return hasChanged;
  }
  invalidate() {
    this.valid = false;
  }
  update(context, parent) {
    super.update(context, parent);
    if (this.hasChanged || (parent && parent.hasChanged)) {
      mat4.invert(this.inverseMatrix, this.globalMatrix);
      mat4.multiply(this.pvMatrix, this.projectMatrix, this.inverseMatrix);
    }
    // TODO We should append camera information to the context, however
    // Context is not available yet, so it'd be better to use console.log
    // to debug the object (To check its presence)
    // console.log('Camera object: ' + this.type);
    // console.log(this);
    context.camera = this;
  }
}
