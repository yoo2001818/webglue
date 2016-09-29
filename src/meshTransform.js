import Transform from './transform';

import { mat3 } from 'gl-matrix';

export default class MeshTransform extends Transform {
  constructor(position, rotation, scale, parent) {
    super(position, rotation, scale, parent);

    this.normalMatrix = mat3.create();
    this._normalTicks = -1;

    this.getNormal = this.getNormal.bind(this);
  }
  getNormal() {
    let matrix = this.get();
    if (this._normalTicks === this._transformTicks) return this.normalMatrix;
    this._normalTicks = this._transformTicks;
    return mat3.normalFromMat4(this.normalMatrix, matrix);
  }
}
