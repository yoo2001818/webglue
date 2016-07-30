import Geometry2D from '../../geom/geometry2D';

const POINT_GEOM = Symbol('geometry_point');

// A geometry object representing a single... point.
export default class PointGeometry extends Geometry2D {
  constructor() {
    super(POINT_GEOM);
    this.vertices = new Float32Array([0, 0]);
    this.type = 'points';
  }
}
