import Geometry3D from './geometry3D';

// Uni-directional quad geometry used by post-processing scene.
export default class UniQuadGeometry extends Geometry3D {
  constructor(hSlice = 1, vSlice = 1) {
    super();
    this.vertices = new Float32Array((hSlice + 1) * (vSlice + 1) * 3);
    this.texCoords = new Float32Array((hSlice + 1) * (vSlice + 1) * 2);
    if ((hSlice + 1) * (vSlice + 1) > 65535) {
      this.indices = new Uint32Array(hSlice * vSlice * 6);
    } else {
      this.indices = new Uint16Array(hSlice * vSlice * 6);
    }
    // Mark vertices
    for (let y = 0; y <= vSlice; ++y) {
      let yPos = y / vSlice * 2 - 1;
      for (let x = 0; x <= hSlice; ++x) {
        let xPos = x / hSlice * 2 - 1;
        let pos = y * (hSlice + 1) + x;
        this.vertices[pos* 3] = xPos;
        this.vertices[pos * 3 + 1] = yPos;
        this.vertices[pos * 3 + 2] = 0;
        this.texCoords[pos * 2] = xPos;
        this.texCoords[pos * 2+ 1] = yPos;
      }
    }
    // Mark indices
    for (let y = 0; y < vSlice; ++y) {
      for (let x = 0; x < hSlice; ++x) {
        // Vertex indices
        let tl = y * (hSlice + 1) + x;
        let tr = y * (hSlice + 1) + x + 1;
        let bl = (y + 1) * (hSlice + 1) + x;
        let br = (y + 1) * (hSlice + 1) + x + 1;
        // Actual index position
        let pos = (y * hSlice + x) * 6;
        this.indices[pos] = tl;
        this.indices[pos + 1] = tr;
        this.indices[pos + 2] = br;
        this.indices[pos + 3] = br;
        this.indices[pos + 4] = bl;
        this.indices[pos + 5] = tl;
      }
    }
    this.calculateNormals();
  }
}
