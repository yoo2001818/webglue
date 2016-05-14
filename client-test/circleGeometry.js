import Geometry from '../src/geometry';

// A geometry object representing a circle.
export default class CircleGeometry extends Geometry {
  constructor(polygons, radius = 1, name) {
    super(name);
    // Easy! ... Seriously.
    this.vertices = new Float32Array(polygons * 3);
    this.indices = new Uint8Array(polygons * 2);
    for (let i = 0; i < polygons; ++i) {
      this.vertices[i * 3] = Math.cos(i / polygons * Math.PI * 2) * radius;
      this.vertices[i * 3 + 1] = Math.sin(i / polygons * Math.PI * 2) * radius;
      this.vertices[i * 3 + 2] = 0;
      this.indices[i * 2] = i;
      this.indices[i * 2 + 1] = i + 1;
    }
    this.indices[polygons * 2 - 1] = 0;
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
}
