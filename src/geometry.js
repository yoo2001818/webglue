export default class Geometry {
  constructor(name) {
    this.indices = null;
    this.type = 'triangles';
    this.name = name || Symbol('geometry_' + (Math.random() * 1000 | 0));
  }
  getVertexCount() {
    return 0;
  }
  upload() {
    throw new Error('Subclass did not implement the method');
  }
  use() {
    throw new Error('Subclass did not implement the method');
  }
}
