import ChannelGeometry3D from '../../geom/channelGeometry3D';

// A box geometry used to test ChannelGeometry.
export default class ChannelBoxGeometry extends ChannelGeometry3D {
  constructor(name) {
    super(name);
    this.vertices = VERTICES;
    this.texCoords = TEXCOORDS;
    this.vertexIndices = VERTEX_INDICES;
    this.texCoordIndices = TEXCOORD_INDICES;
    this.calculateNormals();
    this.calculateTangents();
  }
}

const VERTICES = new Float32Array([
  -1, -1, 1,
  1, -1, 1,
  1, 1, 1,
  -1, 1, 1,

  1, -1, -1,
  -1, -1, -1,
  -1, 1, -1,
  1, 1, -1
]);

const TEXCOORDS = new Float32Array([
  0, 0,
  1, 0,
  0, 1,
  1, 1
]);

const VERTEX_INDICES = [
  0, 1, 2, 2, 3, 0,
  4, 5, 6, 6, 7, 4,
  1, 4, 7, 7, 2, 1,
  5, 0, 3, 3, 6, 5,
  3, 2, 7, 7, 6, 3,
  5, 4, 1, 1, 0, 5
];

const TEXCOORD_INDICES = [
  0, 1, 3, 3, 2, 0,
  0, 1, 3, 3, 2, 0,
  0, 1, 3, 3, 2, 0,
  0, 1, 3, 3, 2, 0,
  0, 1, 3, 3, 2, 0,
  0, 1, 3, 3, 2, 0
];
