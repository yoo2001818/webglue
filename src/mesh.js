import { mat3 } from 'gl-matrix';

import Object3D from './object3D';

export default class Mesh extends Object3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
    this.visible = true;
    this.normalMatrix = mat3.create();
  }
  update(context, parent) {
    super.update(context, parent);
    if (this.hasChanged || (parent && parent.hasChanged)) {
      // Rebuild normal matrix from the global matrix
      mat3.normalFromMat4(this.normalMatrix, this.globalMatrix);
    }
    if (this.visible) {
      // TODO Append the mesh information to the context, however context object
      // is absent as well, so we use console.log to debug mesh information.
      console.log('Mesh: ' + this.geometry.name.toString() + ', ' +
        this.material.name.toString());
    }
  }
}
