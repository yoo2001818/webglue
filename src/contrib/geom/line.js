import Geometry from '../../geom/geometry';

const LINE_GEOM = Symbol('geometry_line');

// A geometry object representing a single line.
export default class LineGeometry extends Geometry {
  constructor() {
    super(LINE_GEOM);
    this.vertices = new Float32Array([0, 0, 0, 1, 0, 0]);
    this.indices = new Uint8Array([0, 1]);
    this.type = 'lines';
  }
  getVertexCount() {
    return this.vertices.length / 3 | 0;
  }
  getAttributes() {
    return {
      aPosition: {
        axis: 3,
        data: this.vertices
      }
    };
  }
  getIndices() {
    return this.indices;
  }
}
