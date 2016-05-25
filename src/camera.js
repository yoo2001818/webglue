import { mat4 } from 'gl-matrix';

import Object3D from './object3D';

export default class Camera extends Object3D {
  constructor() {
    super();
    this.type = 'persp';
    this.aspect = 1;
    this.near = 0.3;
    this.far = 1000;
    this.fov = Math.PI / 180 * 70;
    this.zoom = 1;
    this.valid = false;
    this.projectMatrix = mat4.create();
    this.inverseMatrix = mat4.create();
    this.pvMatrix = mat4.create();
  }
  validate() {
    let hasChanged = super.validate() || !this.valid;
    if (!this.valid) {
      if (this.type === 'ortho') {
        mat4.ortho(this.projectMatrix,
          -this.aspect * this.zoom, this.aspect * this.zoom,
          -1 * this.zoom, 1 * this.zoom,
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
  validateAspect(aspect) {
    // Called by RenderContext to validate aspect ratio.
    if (this.aspect !== aspect) {
      this.aspect = aspect;
      this.invalidate();
      this.validate();
      // This is calculated at the update time; however this should be done
      // now.
      mat4.multiply(this.pvMatrix, this.projectMatrix, this.inverseMatrix);
      return true;
    }
    return false;
  }
  update(context, parent) {
    super.update(context, parent);
    if (this.hasChanged || (parent && parent.hasChanged)) {
      mat4.invert(this.inverseMatrix, this.globalMatrix);
      mat4.multiply(this.pvMatrix, this.projectMatrix, this.inverseMatrix);
    }
  }
}
