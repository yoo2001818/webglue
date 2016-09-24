import Geometry from './geometry';

export default class GeometryManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.geometries = [];
    this.current = null;
  }
  create(options) {
    if (Array.isArray(options)) {
      return options.map(v => this.create(v));
    }
    let finalOpts = options;
    // Old geometry compatibility code
    if (options.getAttributes) {
      finalOpts = {};
      finalOpts.attributes = options.getAttributes();
      finalOpts.indices = options.getIndices();
      switch (options.type) {
      case 'points':
        finalOpts.mode = this.renderer.gl.POINTS;
        break;
      case 'lines':
        finalOpts.mode = this.renderer.gl.LINES;
        break;
      case 'triangles':
      default:
        finalOpts.mode = this.renderer.gl.TRIANGLES;
        break;
      }
    }
    // attributes, indices, mode (or passes)
    let geometry = new Geometry(this.renderer, finalOpts);
    this.geometries.push(geometry);
    return geometry;
  }
  use(geometry) {
    if (Array.isArray(geometry)) {
      // Can't use :/
      this.current = geometry;
      return;
    }
    if (geometry == null) return;
    geometry.use();
    this.current = geometry;
  }
  draw() {
    if (Array.isArray(this.current)) {
      this.current.forEach(v => {
        v.use();
        v.draw();
      });
      return;
    }
    this.current.draw();
  }
  reset() {
    this.current = null;
    this.geometries.forEach(geometry => geometry.dispose());
  }
}
