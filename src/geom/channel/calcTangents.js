import { parseAttribute } from '../../util/parseAttributes';
import parseIndices from '../../util/parseIndices';
import createIndicesArray from '../../util/createIndicesArray';

import { vec2, vec3 } from 'gl-matrix';

export default function calcTangents(input) {
  let positions = parseAttribute(input.attributes.aPosition);
  let indices = parseIndices(input.indices.aPosition);
  let texCoords = parseAttribute(input.attributes.aTexCoord);
  let texIndices = parseIndices(input.indices.aTexCoord);
  if (positions == null || indices == null) {
    throw new Error('Position attribute and indices must be specified');
  }
  if (texCoords == null || texIndices == null) {
    throw new Error('Position attribute and indices must be specified');
  }
  // One vec4 per one face. so indices / 3 * 4.
  let tangents = new Float32Array(indices.length / 3 * 4);
  let tangentIndices = createIndicesArray(indices.length / 3,
    indices.length);
  let tangentId = 0;
  for (let faceId = 0; faceId < indices.length; faceId += 3) {
    const vertexId1 = indices[faceId];
    const vertexId2 = indices[faceId + 1];
    const vertexId3 = indices[faceId + 2];
    const texId1 = texIndices[faceId];
    const texId2 = texIndices[faceId + 1];
    const texId3 = texIndices[faceId + 2];
    // Calculate tangent vector.
    let origin = positions.data.subarray(vertexId1 * 3, vertexId1 * 3 + 3);
    let p1 = vec3.create();
    vec3.subtract(p1, positions.data.subarray(vertexId2 * 3, vertexId2 * 3 + 3),
      origin);
    let p2 = vec3.create();
    vec3.subtract(p2, positions.data.subarray(vertexId3 * 3, vertexId3 * 3 + 3),
      origin);
    let texOrigin = texCoords.data.subarray(texId1 * 2, texId1 * 2 + 2);
    let texP1 = vec2.create();
    vec2.subtract(texP1, texCoords.data.subarray(texId2 * 2,
      texId2 * 2 + 2), texOrigin);
    let texP2 = vec2.create();
    vec2.subtract(texP2, texCoords.data.subarray(texId3 * 2,
      texId3 * 2 + 2), texOrigin);
    // Honestly I don't know what this does.
    let f = 1 / (texP1[0] * texP2[1] - texP2[0] * texP1[1]);
    let tangent = new Float32Array(4);
    tangent[0] = f * (texP2[1] * p1[0] - texP1[1] * p2[0]);
    tangent[1] = f * (texP2[1] * p1[1] - texP1[1] * p2[1]);
    tangent[2] = f * (texP2[1] * p1[2] - texP1[1] * p2[2]);
    // Calculate bi-tangent. To save vertex array, it can be calculated in
    // vertex shader; however we have to specify the cross order to get right
    // result. This can be done by using a modifier... I think.
    // To calculate modifier, we have to calculate dot product with
    // bi-tangent from vertex shader and bi-tangent we calculated.
    let normal = vec3.create();
    vec3.cross(normal, p1, p2);
    vec3.normalize(normal, normal);
    let leftBitangent = vec3.create();
    vec3.cross(leftBitangent, tangent, normal);
    // Then calculate bi-tangent with texture coords.
    let bitangent = vec3.create();
    bitangent[0] = f * (texP2[0] * p1[0] - texP1[0] * p2[0]);
    bitangent[1] = f * (texP2[0] * p1[1] - texP1[0] * p2[1]);
    bitangent[2] = f * (texP2[0] * p1[2] - texP1[0] * p2[2]);
    let modifier = vec3.dot(bitangent, leftBitangent);
    tangent[3] = modifier < 0 ? -1 : 1;
    // Done. Store them in tangents buffer, and set indices to it.
    tangents.set(tangent, tangentId * 4);
    tangentIndices[faceId] = tangentId;
    tangentIndices[faceId + 1] = tangentId;
    tangentIndices[faceId + 2] = tangentId;
    tangentId ++;
  }
  return Object.assign({}, input, {
    attributes: Object.assign({}, input.attributes, {
      aPosition: positions, aTexCoord: texCoords,
      aTangent: { axis: 4, data: tangents }
    }),
    indices: Object.assign({}, input.indices, {
      aPosition: indices, aTexCoord: texIndices, aTangent: tangentIndices
    })
  });
}
