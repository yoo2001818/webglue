import Mesh from '../src/mesh';
import Geometry2D from '../src/geometry2D';
import Material from '../src/material';
import Shader from '../src/shader';

const shader = new Shader(
  require('./shader/grid.vert'),
  require('./shader/grid.frag')
);

export default class Grid extends Mesh {
  constructor(width = 17, height = 17, gap = 1, colors = {
    uColor: new Float32Array([74 / 255, 74 / 255, 74 / 255]),
    uHoriColor: new Float32Array([132 / 255, 22 / 255, 22 / 255]),
    uVertColor: new Float32Array([22 / 255, 22 / 255, 132 / 255])
  }) {
    // Construct vertices data
    let geometry = new Geometry2D();
    let vertices = new Float32Array(4 * (width + height));
    let minX = -(width - 1) / 2 * gap;
    let minY = -(height - 1) / 2 * gap;
    let maxX = (width - 1) / 2 * gap;
    let maxY = (height - 1) / 2 * gap;
    let pos = 0;
    for (let y = 0; y < height; ++y) {
      let offsetY = (y - (height - 1) / 2) * gap;
      vertices[pos++] = minX;
      vertices[pos++] = offsetY;
      vertices[pos++] = maxX;
      vertices[pos++] = offsetY;
    }
    for (let x = 0; x < width; ++x) {
      let offsetX = (x - (width - 1) / 2) * gap;
      vertices[pos++] = offsetX;
      vertices[pos++] = minY;
      vertices[pos++] = offsetX;
      vertices[pos++] = maxY;
    }
    geometry.vertices = vertices;
    geometry.type = 'lines';
    // Construct material
    let material = new Material(shader);
    material.use = () => colors;
    super(geometry, material);
  }
}
