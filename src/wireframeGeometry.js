import Geometry3D from './geometry3D';

export default class WireframeGeometry extends Geometry3D {
  constructor(geometry, name) {
    super(name);
    this.vertices = geometry.vertices;
    this.normals = geometry.normals;
    this.texCoords = geometry.texCoords;
    this.tangents = geometry.tangents;
    this.calculateIndices(geometry.indices);
    this.type = 'lines';
    this.lineWidth = 1;
    this.original = geometry;
  }
  calculateIndices(original) {
    let size = (original.length / 3) | 0;
    let indices = new Uint16Array(original.length * 2);
    for (let i = 0; i < size; ++i) {
      let origPos = i * 3;
      let pos = i * 6;
      indices[pos] = original[origPos];
      indices[pos + 1] = original[origPos + 1];
      indices[pos + 2] = original[origPos + 1];
      indices[pos + 3] = original[origPos + 2];
      indices[pos + 4] = original[origPos + 2];
      indices[pos + 5] = original[origPos];
    }
    this.indices = indices;
  }
}
