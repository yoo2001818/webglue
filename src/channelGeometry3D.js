import ChannelGeometry from './channelGeometry';
import createIndicesArray from './util/createIndicesArray';

import { vec2, vec3 } from 'gl-matrix';

// Similar to Geometry3D, this is representation of 3D object built on
// ChannelGeometry. Since ChannelGeometry supports specifying vertex position,
// texture coordinates, and other attributes separately, it can calculate
// 'smooth' normals easily.
// ChannelGeometry3D's internal format is similar to Wavefront OBJ file -
// except interpolation curves, etc.

export default class ChannelGeometry3D extends ChannelGeometry {
  constructor(name) {
    super(name);
    this.vertices = null;
    this.normals = null;
    this.texCoords = null;
    this.tangents = null;
    this.vertexIndices = null;
    this.normalIndices = null;
    this.texCoordIndices = null;
    this.tangentIndices = null;
  }
  // Calculate normals per face.
  calculateNormals() {
    if (this.vertices === null) throw new Error('Vertices array is null');
    let indices = this.vertexIndices;
    if (indices == null) throw new Error('Position indices is null');
    // One vec3 per one face. so indices / 3 * 3.
    let normals = new Float32Array(indices.length);
    let normalIndices = createIndicesArray(indices.length / 3, indices.length);
    let normalId = 0;
    for (let faceId = 0; faceId < indices.length; faceId += 3) {
      const vertexId1 = indices[faceId];
      const vertexId2 = indices[faceId + 1];
      const vertexId3 = indices[faceId + 2];
      // Calculate normal vector.
      let origin = this.vertices.slice(vertexId1 * 3, vertexId1 * 3 + 3);
      let p1 = vec3.create(), p2 = vec3.create();
      let uv = vec3.create();
      vec3.subtract(p1, this.vertices.slice(vertexId2 * 3, vertexId2 * 3 + 3),
        origin);
      vec3.subtract(p2, this.vertices.slice(vertexId3 * 3, vertexId3 * 3 + 3),
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
    this.normals = normals;
    this.normalIndices = normalIndices;
  }
  // Calculate smooth normals; This is done by providing 'average' normal
  // vector to each vertices.
  calculateSmoothNormals() {
    if (this.vertices === null) throw new Error('Vertices array is null');
    let indices = this.vertexIndices;
    if (indices == null) throw new Error('Position indices is null');
    // One vec3 per one vertex, since we'll normalize that later.
    let normals = new Float32Array(this.vertices.length);
    for (let faceId = 0; faceId < indices.length; faceId += 3) {
      const vertexId1 = indices[faceId];
      const vertexId2 = indices[faceId + 1];
      const vertexId3 = indices[faceId + 2];
      // Calculate normal vector.
      let origin = this.vertices.slice(vertexId1 * 3, vertexId1 * 3 + 3);
      let p1 = vec3.create(), p2 = vec3.create();
      let uv = vec3.create();
      vec3.subtract(p1, this.vertices.slice(vertexId2 * 3, vertexId2 * 3 + 3),
        origin);
      vec3.subtract(p2, this.vertices.slice(vertexId3 * 3, vertexId3 * 3 + 3),
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
      let normal = normals.slice(i, i + 3);
      vec3.normalize(normal, normal);
      normals.set(normal, i);
    }
    // Done!
    this.normals = normals;
    // Normal indices array is EXACTLY same as vertex indices array in this
    // case; we can just use a copy.
    this.normalIndices = indices;
    // Note that we can't use tangents if we use smooth normals. (yet)
  }
  // Calculate tangents per face.
  calculateTangents() {
    if (this.vertices === null) throw new Error('Vertices array is null');
    let posIndices = this.vertexIndices;
    if (posIndices == null) throw new Error('Position indices is null');
    let texIndices = this.texCoordIndices;
    if (texIndices == null) throw new Error('Texture indices is null');
    // One vec4 per one face. so indices / 3 * 4.
    let tangents = new Float32Array(posIndices.length / 3 * 4);
    let tangentIndices = createIndicesArray(posIndices.length / 3,
      posIndices.length);
    let tangentId = 0;
    for (let faceId = 0; faceId < posIndices.length; faceId += 3) {
      const vertexId1 = posIndices[faceId];
      const vertexId2 = posIndices[faceId + 1];
      const vertexId3 = posIndices[faceId + 2];
      const texId1 = texIndices[faceId];
      const texId2 = texIndices[faceId + 1];
      const texId3 = texIndices[faceId + 2];
      // Calculate tangent vector.
      let origin = this.vertices.slice(vertexId1 * 3, vertexId1 * 3 + 3);
      let p1 = vec3.create();
      vec3.subtract(p1, this.vertices.slice(vertexId2 * 3, vertexId2 * 3 + 3),
        origin);
      let p2 = vec3.create();
      vec3.subtract(p2, this.vertices.slice(vertexId3 * 3, vertexId3 * 3 + 3),
        origin);
      let texOrigin = this.texCoords.slice(texId1 * 2, texId1 * 2 + 2);
      let texP1 = vec2.create();
      vec2.subtract(texP1, this.texCoords.slice(texId2 * 2,
        texId2 * 2 + 2), texOrigin);
      let texP2 = vec2.create();
      vec2.subtract(texP2, this.texCoords.slice(texId3 * 2,
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
    this.tangents = tangents;
    this.tangentIndices = tangentIndices;
  }
  getChannelAttributes() {
    return {
      aPosition: {
        axis: 3,
        data: this.vertices
      },
      aNormal: {
        axis: 3,
        data: this.normals
      },
      aTexCoord: {
        axis: 2,
        data: this.texCoords
      },
      aTangent: {
        axis: 4,
        data: this.tangents
      }
    };
  }
  getChannelIndices() {
    return {
      aPosition: this.vertexIndices,
      aNormal: this.normalIndices,
      aTexCoord: this.texCoordIndices,
      aTangent: this.tangentIndices
    };
  }
}
