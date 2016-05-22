export default function createIndicesArray(vertices, indices) {
  if (vertices <= 256) {
    return new Uint8Array(indices);
  } else if (vertices <= 65536) {
    return new Uint16Array(indices);
  } else {
    // Handle overflow, however, WebGL doesn't support Uint32Array without
    // extensions. ... But the extension is available on 98% of total devices
    // that support WebGL, so it won't be a problem.
    return new Uint32Array(indices);
  }
}
