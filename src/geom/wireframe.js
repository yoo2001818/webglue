import { TRIANGLES, LINES } from '../renderer/geometry';
import { parseAttribute } from '../util/parseAttributes';
import createIndicesArray from '../util/createIndicesArray';

function getVerticesCount(geometry) {
  for (let key in geometry.attributes) {
    let attribute = parseAttribute(geometry.attributes[key]);
    return attribute.data.length / attribute.axis;
  }
  throw new Error('There must be at least one attribute');
}

export default function wireframe(input) {
  if (input.mode != null && input.mode != TRIANGLES) {
    throw new Error('Wireframe geometry only supports triangles');
  }
  let verticesCount = getVerticesCount(input);
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
