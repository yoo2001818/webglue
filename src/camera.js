import { mat4 } from 'gl-matrix';

import Object3D from './object3D';

export default class Camera extends Object3D {
  constructor(options) {
    super();
    this.aspect = 1;
    this.options = Object.assign({
      type: 'persp',
      near: 0.3,
      far: 1000,
      fov: Math.PI / 180 * 70,
      zoom: 1
    }, options);
    this.projectMatrix = mat4.create();
    this.inverseMatrix = mat4.create();
    this.pvMatrix = mat4.create();
  }
  validate() {
    let hasChanged = super.validate() || !this.valid;
    if (!this.valid) {
      if (this.options.type === 'ortho') {
        mat4.ortho(this.projectMatrix,
          -this.aspect * this.options.zoom, this.aspect * this.options.zoom,
          -1 * this.options.zoom, 1 * this.options.zoom,
          this.options.near, this.options.far);
      } else {
        mat4.perspective(this.projectMatrix, this.options.fov, this.aspect,
          this.options.near, this.options.far);
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
