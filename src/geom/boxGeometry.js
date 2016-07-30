import Geometry3D from './geometry3D';

export default class BoxGeometry extends Geometry3D {
  constructor() {
    super();
    this.vertices = BoxGeometry.VERTICES;
    this.texCoords = BoxGeometry.TEXCOORDS;
    this.indices = BoxGeometry.INDICES;
    this.calculateNormals();
    this.calculateTangents();
  }
}

/* eslint-disable indent */

BoxGeometry.VERTICES = new Float32Array([
  // Front
  -1.0, -1.0,  1.0,
   1.0, -1.0,  1.0,
   1.0,  1.0,  1.0,
  -1.0,  1.0,  1.0,
  // Top
  -1.0,  1.0,  1.0,
   1.0,  1.0,  1.0,
   1.0,  1.0, -1.0,
  -1.0,  1.0, -1.0,
  // Back
   1.0, -1.0, -1.0,
  -1.0, -1.0, -1.0,
  -1.0,  1.0, -1.0,
   1.0,  1.0, -1.0,
  // Bottom
  -1.0, -1.0, -1.0,
   1.0, -1.0, -1.0,
   1.0, -1.0,  1.0,
  -1.0, -1.0,  1.0,
  // Left
  -1.0, -1.0, -1.0,
  -1.0, -1.0,  1.0,
  -1.0,  1.0,  1.0,
  -1.0,  1.0, -1.0,
  // Right
   1.0, -1.0,  1.0,
   1.0, -1.0, -1.0,
   1.0,  1.0, -1.0,
   1.0,  1.0,  1.0
]);

BoxGeometry.INDICES = new Uint16Array([
   0,  1,  2,  2,  3,  0,
   4,  5,  6,  6,  7,  4,
   8,  9, 10, 10, 11,  8,
  12, 13, 14, 14, 15, 12,
  16, 17, 18, 18, 19, 16,
  20, 21, 22, 22, 23, 20
]);

/* eslint-enable indent */

BoxGeometry.TEXCOORDS = new Float32Array(2 * 4 * 6);
// Generate texture coords on the fly, because why not?
BoxGeometry.TEXCOORDS.set([ 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 ], 0);
for (let i = 0; i < 6; ++i) {
  BoxGeometry.TEXCOORDS.copyWithin(i * 2 * 4, 0, 2 * 4);
}
