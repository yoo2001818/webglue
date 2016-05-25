import Geometry2D from './geometry2D';

// Uni-directional quad geometry used by post-processing scene.
export default class UniQuadGeometry extends Geometry2D {
  constructor() {
    super();
    this.vertices = UniQuadGeometry.VERTICES;
    this.indices = UniQuadGeometry.INDICES;
  }
}

/* eslint-disable indent */

UniQuadGeometry.VERTICES = new Float32Array([
  -1.0, -1.0,
   1.0, -1.0,
   1.0,  1.0,
  -1.0,  1.0
]);

UniQuadGeometry.INDICES = new Uint16Array([
   0,  1,  2,  2,  3,  0
]);

/* eslint-enable indent */
