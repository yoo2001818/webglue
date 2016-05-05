import Geometry2D from '../src/geometry2D';

const LINE_GEOM = Symbol('geometry_line');

// A geometry object representing a single line.
export default class LineGeometry extends Geometry2D {
  constructor() {
    super(LINE_GEOM);
    this.vertices = new Float32Array([0, 0, 1, 0]);
    this.type = 'lines';
  }
}
