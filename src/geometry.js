export default class Geometry {
  constructor(name) {
    this.indices = null;
    this.type = 'triangles';
    this.name = name || Symbol('geometry_' + (Math.random() * 1000 | 0));
  }
}
