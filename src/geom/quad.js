// Uni-directional quad geometry used by post-processing scene.
export default function quad(hSlice = 1, vSlice = 1) {
  let vertices = new Float32Array((hSlice + 1) * (vSlice + 1) * 3);
  let texCoords = new Float32Array((hSlice + 1) * (vSlice + 1) * 2);
  let indices;
  if ((hSlice + 1) * (vSlice + 1) > 65535) {
    indices = new Uint32Array(hSlice * vSlice * 6);
  } else {
    indices = new Uint16Array(hSlice * vSlice * 6);
  }
  // Mark vertices
  for (let y = 0; y <= vSlice; ++y) {
    let yPos = y / vSlice * 2 - 1;
    for (let x = 0; x <= hSlice; ++x) {
      let xPos = x / hSlice * 2 - 1;
      let pos = y * (hSlice + 1) + x;
      vertices[pos * 3] = xPos;
      vertices[pos * 3 + 1] = yPos;
      vertices[pos * 3 + 2] = 0;
      texCoords[pos * 2] = (xPos + 1) / 2;
      texCoords[pos * 2 + 1] = (yPos + 1) / 2;
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
      indices[pos] = tl;
      indices[pos + 1] = tr;
      indices[pos + 2] = br;
      indices[pos + 3] = br;
      indices[pos + 4] = bl;
      indices[pos + 5] = tl;
    }
  }
  return {
    attributes: {
      aPosition: {axis: 3, data: vertices},
      aTexCoord: {axis: 2, data: texCoords}
    }, indices
  };
}
