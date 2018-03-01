import BaseTransform from './baseTransform';

import { mat4 } from 'gl-matrix';

export default class Transform extends BaseTransform {
  constructor(position, rotation, scale, parent) {
    super(position, rotation, scale);

    this.matrix = mat4.create();
    this.parent = parent;
    this._localTicks = -1;
    this._parentTicks = -1;
    this._transformTicks = 0;

    this.get = this.get.bind(this);
  }
  get() {
    let local = super.get();
    if (this.parent == null) {
      this._transformTicks = this.ticks;
      return local;
    } else {
      let parentMatrix = this.parent.get();
      if (this._parentTicks !== this.parent.ticks ||
        this._localTicks !== this.ticks
      ) {
        this._parentTicks = this.parent.ticks;
        this._localTicks = this.ticks;
        this._transformTicks ++;
        mat4.multiply(this.matrix, parentMatrix, local);
      }
      return this.matrix;
    }
  }
}
