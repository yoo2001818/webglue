import Geometry3D from './geometry3D';

export default class QuadGeometry extends Geometry3D {
  constructor() {
    super();
    this.vertices = QuadGeometry.VERTICES;
    this.texCoords = QuadGeometry.TEXCOORDS;
    this.indices = QuadGeometry.INDICES;
    this.calculateNormals();
    this.calculateTangents();
  }
}

/* eslint-disable indent */

QuadGeometry.VERTICES = new Float32Array([
  // Top
  -1.0,  0.0,  1.0,
   1.0,  0.0,  1.0,
   1.0,  0.0, -1.0,
  -1.0,  0.0, -1.0,
  // Bottom
  -1.0,  0.0, -1.0,
   1.0,  0.0, -1.0,
   1.0,  0.0,  1.0,
  -1.0,  0.0,  1.0
]);

QuadGeometry.INDICES = new Uint16Array([
   0,  1,  2,  2,  3,  0,
   4,  5,  6,  6,  7,  4
]);

/* eslint-enable indent */

QuadGeometry.TEXCOORDS = new Float32Array(2 * 4 * 2);
// Generate texture coords on the fly, because why not?
QuadGeometry.TEXCOORDS.set([ 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 ], 0);
for (let i = 0; i < 2; ++i) {
  QuadGeometry.TEXCOORDS.copyWithin(i * 2 * 4, 0, 2 * 4);
}
