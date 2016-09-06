import { parseAttribute } from '../util/parseAttributes';
import parseIndices from '../util/parseIndices';

import { vec2, vec3 } from 'gl-matrix';

export default function calcTangents(geometry) {
  let vertices = parseAttribute(geometry.attributes.aPosition);
  if (vertices == null) throw new Error('aPosition must be specified');
  vertices = vertices.data;
  let texCoords = parseAttribute(geometry.attributes.aTexCoord);
  if (texCoords == null) throw new Error('aTexCoord must be specified');
  texCoords = texCoords.data;
  // Resize the array
  let tangents = new Float32Array(vertices.length / 3 * 4);
  let indices = parseIndices(geometry.indices);
  if (indices == null) throw new Error('Indices must be specified');
  for (let faceId = 0; faceId < indices.length; faceId += 3) {
    const vertexId1 = indices[faceId];
    const vertexId2 = indices[faceId + 1];
    const vertexId3 = indices[faceId + 2];
    // Calculate tangent vector.
    let origin = vertices.slice(vertexId1 * 3, vertexId1 * 3 + 3);
    let p1 = vec3.create();
    vec3.subtract(p1, vertices.slice(vertexId2 * 3, vertexId2 * 3 + 3),
      origin);
    let p2 = vec3.create();
    vec3.subtract(p2, vertices.slice(vertexId3 * 3, vertexId3 * 3 + 3),
      origin);
    let texOrigin = texCoords.slice(vertexId1 * 2, vertexId1 * 2 + 2);
    let texP1 = vec2.create();
    vec2.subtract(texP1, texCoords.slice(vertexId2 * 2,
      vertexId2 * 2 + 2), texOrigin);
    let texP2 = vec2.create();
    vec2.subtract(texP2, texCoords.slice(vertexId3 * 2,
      vertexId3 * 2 + 2), texOrigin);
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
    // Done! Paste them to those three vertices.
    tangents.set(tangent, vertexId1 * 4);
    tangents.set(tangent, vertexId2 * 4);
    tangents.set(tangent, vertexId3 * 4);
  }
  return Object.assign({}, geometry, {
    attributes: Object.assign({}, geometry.attributes, {
      aTangent: {axis: 4, data: tangents}
    })
  });
}
