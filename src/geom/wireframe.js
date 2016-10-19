import { TRIANGLES, LINES } from '../renderer/geometry';
import getVerticesCount from '../util/getVerticesCount';
import createIndicesArray from '../util/createIndicesArray';

export default function wireframe(input) {
  if (Array.isArray(input)) return input.map(v => wireframe(v));
  if (input.mode != null && input.mode != TRIANGLES) return input;
  let verticesCount = getVerticesCount(input.attributes);
  if (input.indices) {
    let indices = createIndicesArray(verticesCount,
      input.indices.length * 2);
    // Rebuild indices
    for (let i = 0; i < Math.floor(input.indices.length / 3); ++i) {
      indices[i * 6] = input.indices[i * 3];
      indices[i * 6 + 1] = input.indices[i * 3 + 1];
      indices[i * 6 + 2] = input.indices[i * 3 + 1];
      indices[i * 6 + 3] = input.indices[i * 3 + 2];
      indices[i * 6 + 4] = input.indices[i * 3 + 2];
      indices[i * 6 + 5] = input.indices[i * 3];
    }
    return Object.assign({}, input, { indices, mode: LINES });
  } else {
    // Linear mode; generate indices using vertices count
    let indices = createIndicesArray(verticesCount, verticesCount * 2);
    // Rebuild indices
    for (let i = 0; i < Math.floor(verticesCount / 3); ++i) {
      indices[i * 6] = i * 3;
      indices[i * 6 + 1] = i * 3 + 1;
      indices[i * 6 + 2] = i * 3 + 1;
      indices[i * 6 + 3] = i * 3 + 2;
      indices[i * 6 + 4] = i * 3 + 2;
      indices[i * 6 + 5] = i * 3;
    }
    return Object.assign({}, input, { indices, mode: LINES });
  }
}
