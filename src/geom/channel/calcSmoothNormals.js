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
  // One vec3 per one vertex, since we'll normalize that later.
  let normals = new Float32Array(positionsData.length);
  for (let faceId = 0; faceId < indices.length; faceId += 3) {
    const vertexId1 = indices[faceId];
    const vertexId2 = indices[faceId + 1];
    const vertexId3 = indices[faceId + 2];
    // Calculate normal vector.
    let origin = positionsData.slice(vertexId1 * 3, vertexId1 * 3 + 3);
    let p1 = vec3.create(), p2 = vec3.create();
    let uv = vec3.create();
    vec3.subtract(p1, positionsData.slice(vertexId2 * 3, vertexId2 * 3 + 3),
      origin);
    vec3.subtract(p2, positionsData.slice(vertexId3 * 3, vertexId3 * 3 + 3),
      origin);
    vec3.cross(uv, p1, p2);
    vec3.normalize(uv, uv);
    // Done. Store them in normals buffer. 'Average' buffer can be calculated
    // by adding them all, and normalizing it. So we have to add normal
    // vector to each vertex in this stage.
    normals[vertexId1 * 3] += uv[0];
    normals[vertexId1 * 3 + 1] += uv[1];
    normals[vertexId1 * 3 + 2] += uv[2];
    normals[vertexId2 * 3] += uv[0];
    normals[vertexId2 * 3 + 1] += uv[1];
    normals[vertexId2 * 3 + 2] += uv[2];
    normals[vertexId3 * 3] += uv[0];
    normals[vertexId3 * 3 + 1] += uv[1];
    normals[vertexId3 * 3 + 2] += uv[2];
  }
  // Now, normalize each normal vector.
  for (let i = 0; i < normals.length; i += 3) {
    let normal = normals.subarray(i, i + 3);
    vec3.normalize(normal, normal);
  }
  // Note that we can't use tangents if we use smooth normals. (yet)
  return Object.assign({}, input, {
    attributes: Object.assign({}, input.attributes, {
      aPosition: positions, aNormal: { axis: 3, data: normals }
    }),
    indices: Object.assign({}, input.indices, {
      aPosition: indices, aNormal: indices
    })
  });
}
