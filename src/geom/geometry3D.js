import Geometry from './geometry';

import { vec2, vec3 } from 'gl-matrix';

export default class Geometry3D extends Geometry {
  constructor(name) {
    super(name);
    this.vertices = null;
    this.normals = null;
    this.texCoords = null;
    this.tangents = null;
    this.indices = null;
  }
  getVertexCount() {
    return this.vertices.length / 3 | 0;
  }
  // Recalculate normals. Indices array must be present to use this.
  calculateNormals(smooth = false) {
    if (this.vertices === null) throw new Error('Vertices array is null');
    // If normal vector array is not present, create one.
    if (this.normals === null) {
      this.normals = new Float32Array(this.vertices.length);
    }
    // Uh, maybe the variable names are too verbose. I think.
    for (let faceId = 0; faceId < this.indices.length; faceId += 3) {
      const vertexId1 = this.indices[faceId];
      const vertexId2 = this.indices[faceId + 1];
      const vertexId3 = this.indices[faceId + 2];
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
      // Done! Paste them to those three vertices.
      this.normals[vertexId1 * 3] += uv[0];
      this.normals[vertexId1 * 3 + 1] += uv[1];
      this.normals[vertexId1 * 3 + 2] += uv[2];
      this.normals[vertexId2 * 3] += uv[0];
      this.normals[vertexId2 * 3 + 1] += uv[1];
      this.normals[vertexId2 * 3 + 2] += uv[2];
      this.normals[vertexId3 * 3] += uv[0];
      this.normals[vertexId3 * 3 + 1] += uv[1];
      this.normals[vertexId3 * 3 + 2] += uv[2];
    }
    if (!smooth) return;
    for (let vertexId = 0; vertexId < this.normals.length; vertexId += 3) {
      let len = Math.sqrt(
        this.normals[vertexId] * this.normals[vertexId] +
        this.normals[vertexId + 1] * this.normals[vertexId + 1] +
        this.normals[vertexId + 2] * this.normals[vertexId + 2]);
      this.normals[vertexId] /= len;
      this.normals[vertexId + 1] /= len;
      this.normals[vertexId + 2] /= len;
    }
  }
  // Recalculate tangents. This shouldn't be required if normal map or
  // height map is not present.
  calculateTangents() {
    if (this.vertices === null) throw new Error('Vertices array is null');
    // If tangent vector array is not present, create one.
    if (this.tangents === null) {
      this.tangents = new Float32Array(this.vertices.length / 3 * 4);
    }
    // Uh, maybe the variable names are too verbose. I think.
    for (let faceId = 0; faceId < this.indices.length; faceId += 3) {
      const vertexId1 = this.indices[faceId];
      const vertexId2 = this.indices[faceId + 1];
      const vertexId3 = this.indices[faceId + 2];
      // Calculate tangent vector.
      let origin = this.vertices.slice(vertexId1 * 3, vertexId1 * 3 + 3);
      let p1 = vec3.create();
      vec3.subtract(p1, this.vertices.slice(vertexId2 * 3, vertexId2 * 3 + 3),
        origin);
      let p2 = vec3.create();
      vec3.subtract(p2, this.vertices.slice(vertexId3 * 3, vertexId3 * 3 + 3),
        origin);
      let texOrigin = this.texCoords.slice(vertexId1 * 2, vertexId1 * 2 + 2);
      let texP1 = vec2.create();
      vec2.subtract(texP1, this.texCoords.slice(vertexId2 * 2,
        vertexId2 * 2 + 2), texOrigin);
      let texP2 = vec2.create();
      vec2.subtract(texP2, this.texCoords.slice(vertexId3 * 2,
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
      this.tangents.set(tangent, vertexId1 * 4);
      this.tangents.set(tangent, vertexId2 * 4);
      this.tangents.set(tangent, vertexId3 * 4);
    }
  }
  getAttributes() {
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
  getIndices() {
    return this.indices;
  }
}
