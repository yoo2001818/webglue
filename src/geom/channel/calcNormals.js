import { parseAttribute } from '../../util/parseAttributes';
import parseIndices from '../../util/parseIndices';
import createIndicesArray from '../../util/createIndicesArray';

import { vec3 } from 'gl-matrix';

export default function calcNormals(input) {
  let positions = parseAttribute(input.attributes.aPosition);
  let indices = parseIndices(input.indices.aPosition);
  if (positions == null || indices == null) {
    throw new Error('Position attribute and indices must be specified');
  }
  let positionsData = positions.data;
  // One vec3 per one face. so indices / 3 * 3.
  let normals = new Float32Array(indices.length);
  let normalIndices = createIndicesArray(indices.length / 3, indices.length);
  let normalId = 0;
  for (let faceId = 0; faceId < indices.length; faceId += 3) {
    const vertexId1 = indices[faceId];
    const vertexId2 = indices[faceId + 1];
    const vertexId3 = indices[faceId + 2];
    // Calculate normal vector.
    let origin = positionsData.subarray(vertexId1 * 3, vertexId1 * 3 + 3);
    let p1 = vec3.create(), p2 = vec3.create();
    let uv = vec3.create();
    vec3.subtract(p1, positionsData.subarray(vertexId2 * 3, vertexId2 * 3 + 3),
      origin);
    vec3.subtract(p2, positionsData.subarray(vertexId3 * 3, vertexId3 * 3 + 3),
      origin);
    vec3.cross(uv, p1, p2);
    vec3.normalize(uv, uv);
    // Done. Store them in normals buffer, and set indices to it.
    normals.set(uv, normalId * 3);
    normalIndices[faceId] = normalId;
    normalIndices[faceId + 1] = normalId;
    normalIndices[faceId + 2] = normalId;
    normalId ++;
  }
  return Object.assign({}, input, {
    attributes: Object.assign({}, input.attributes, {
      aPosition: positions, aNormal: { axis: 3, data: normals }
    }),
    indices: Object.assign({}, input.indices, {
      aPosition: indices, aNormal: normalIndices
    })
  });
}
