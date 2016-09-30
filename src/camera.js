import { mat4 } from 'gl-matrix';

import Object3D from './object3D';

export function perspective(fov, near, far) {
  return (out, aspect) => mat4.perspective(out, fov, aspect, near, far);
}

// Zoom value may be changed often...
export function orthogonal(zoom, near, far) {
  return (out, aspect) => mat4.ortho(out, -aspect * zoom, aspect * zoom,
    -zoom, zoom, near, far);
}

export default class Camera extends Object3D {
  constructor(projection = perspective(Math.PI / 180 * 70, 0.3, 1000)) {
    super();
    this.projection = projection;

    this.getProjection = this.getProjection.bind(this);
    this.getInverseProjection = this.getInverseProjection.bind(this);
    this.getView = this.getView.bind(this);
    this.getPV = this.getPV.bind(this);

    // This is awkward.... TODO Refactor
    this._prevProjection = null;
    this._aspect = 1;
    this.projectionTicks = 0;
    this.projectionMatrix = mat4.create();

    this.inverseProjectionTicks = 0;
    this.inverseProjectionMatrix = mat4.create();

    this.viewTicks = 0;
    this.viewMatrix = mat4.create();

    this._pvProjectionTicks = -1;
    this._pvViewTicks = -1;
    this.pvTicks = 0;
    this.pvMatrix = mat4.create();
  }
  get(input) {
    return {
      uProjection: this.getProjection(input),
      uView: this.getView(),
      uProjectionView: this.getPV(input)
    };
  }
  getProjection(input) {
    let aspect;
    if (typeof input === 'number') {
      aspect = input;
    } else if (typeof input === 'object') {
      // Received a shader object - we need to get current aspect ratio.
      aspect = input.renderer.width / input.renderer.height;
    } else {
      aspect = this._aspect;
    }
    if (this._aspect !== aspect || this._prevProjection !== this.projection) {
      this._prevProjection = this.projection;
      this._aspect = aspect;
      this.projection(this.projectionMatrix, aspect);
      this.projectionTicks ++;
    }
    return this.projectionMatrix;
  }
  getInverseProjection(input) {
    let projectionMat = this.getProjection(input);
    if (this.inverseProjectionTicks !== this.projectionTicks) {
      this.inverseProjectionTicks = this.projectionTicks;
      mat4.invert(this.inverseProjectionMatrix, projectionMat);
    }
    return this.inverseProjectionMatrix;
  }
  getView() {
    let transformMat = this.transform.get();
    if (this.viewTicks !== this.transform.ticks) {
      // We can directly copy transform's ticks
      this.viewTicks = this.transform.ticks;
      mat4.invert(this.viewMatrix, transformMat);
    }
    return this.viewMatrix;
  }
  getPV(input) {
    this.getProjection(input);
    this.getView();
    if (this._pvViewTicks !== this.viewTicks ||
      this._pvProjectionTicks !== this.projectionTicks
    ) {
      this._pvViewTicks = this.viewTicks;
      this._pvProjectionTicks = this.projectionTicks;
      mat4.multiply(this.pvMatrix, this.projectionMatrix, this.viewMatrix);
      this.pvTicks ++;
    }
    return this.pvMatrix;
  }
}
