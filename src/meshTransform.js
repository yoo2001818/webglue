import Transform from './transform';

import { mat3, mat4 } from 'gl-matrix';

export default class MeshTransform extends Transform {
  constructor(position, rotation, scale, parent) {
    super(position, rotation, scale);

    this.matrix = mat4.create();
    this.parent = parent;
    this._localTicks = -1;
    this._parentTicks = -1;

    this.normalMatrix = mat3.create();
    this._normalTicks = -1;

    this.getNormal = this.getNormal.bind(this);
  }
  get() {
    if (this.parent == null) return super.get();
    let parentMatrix = this.parent.get();
    let local = super.get();
    if (this._parentTicks !== this.parent.ticks ||
      this._localTicks !== this.ticks
    ) {
      this._parentTicks = this.parent.ticks;
      this._localTicks = this.ticks;
      mat4.multiply(this.matrix, parentMatrix, local);
    }
    return this.matrix;
  }
  getNormal() {
    let matrix = this.get();
    if (this._normalTicks === this.ticks) return this.normalMatrix;
    this._normalTicks = this.ticks;
    return mat3.normalFromMat4(this.normalMatrix, matrix);
  }
}
