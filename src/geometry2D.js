import Geometry from './geometry';

export default class Geometry2D extends Geometry {
  constructor(name) {
    super(name);
    this.vertices = null;
  }
  getVertexCount() {
    return this.vertices.length / 2 | 0;
  }
  getAttributes() {
    return {
      aPosition: {
        axis: 2,
        data: this.vertices
      }
    };
  }
}
