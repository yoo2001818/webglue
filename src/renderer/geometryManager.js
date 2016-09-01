import Geometry from './geometry';
import CombinedGeometry from './combinedGeometry';

export default class GeometryManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.geometries = [];
    this.current = null;
  }
  create(options) {
    if (Array.isArray(options)) {
      // Create special combinedGeometry object
      let geometry = new CombinedGeometry(this.renderer, options);
      this.geometries.push(geometry);
      return geometry;
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
    if (geometry == null) return;
    geometry.use();
    this.current = geometry;
  }
  draw() {
    this.current.draw();
  }
  reset() {
    this.current = null;
    this.geometries.forEach(geometry => geometry.dispose());
  }
}
