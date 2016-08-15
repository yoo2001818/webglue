import Geometry from './geometry';

export default class GeometryManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.geometries = [];
    this.current = null;
  }
  create(options) {
    // attributes, indices, mode (or passes)
    let geometry = new Geometry(options);
    this.geometries.push(geometry);
    return geometry;
  }
  use(geometry) {
    this.current = geometry;
    geometry.use();
  }
  render() {
    this.current.render();
  }
}
