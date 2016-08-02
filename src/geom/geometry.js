export default class Geometry {
  constructor(name) {
    this.type = 'triangles';
    this.cullFace = 'back';
    this.name = name || Symbol('geometry_' + (Math.random() * 1000 | 0));

    // one of static, dynamic, stream
    this.usage = 'static';
    this.valid = true;
  }
  getVertexCount() {
    return 0;
  }
  getAttributes() {
    return {};
  }
  getIndices() {
    return null;
  }
  validate() {
    this.valid = true;
  }
  invalidate() {
    this.valid = false;
  }
}
