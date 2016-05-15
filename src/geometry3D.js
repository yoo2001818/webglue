import Geometry from './geometry';

import { vec2, vec3 } from 'gl-matrix';

export default class Geometry3D extends Geometry {
  constructor(name) {
    super(name);
    this.vertices = null;
    this.normals = null;
    this.texCoords = null;
    this.tangents = null;
  }
  getVertexCount() {
    return this.vertices.length / 3 | 0;
  }
  // Recalculate normals. Indices array must be present to use this.
  calculateNormals() {
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
      this.normals.set(uv, vertexId1 * 3);
      this.normals.set(uv, vertexId2 * 3);
      this.normals.set(uv, vertexId3 * 3);
    }
  }
  // Recalculate tangents. This shouldn't be required if normal map or
  // height map is not present.
  calculateTangents() {
    if (this.vertices === null) throw new Error('Vertices array is null');
    // If tangent vector array is not present, create one.
    if (this.tangents === null) {
      this.tangents = new Float32Array(this.vertices.length);
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
      let tangent = vec3.create();
      tangent[0] = f * (texP2[1] * p1[0] - texP1[1] * p2[0]);
      tangent[1] = f * (texP2[1] * p1[1] - texP1[1] * p2[1]);
      tangent[2] = f * (texP2[1] * p1[2] - texP1[1] * p2[2]);
      // Done! Paste them to those three vertices.
      this.tangents.set(tangent, vertexId1 * 3);
      this.tangents.set(tangent, vertexId2 * 3);
      this.tangents.set(tangent, vertexId3 * 3);
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
        axis: 3,
        data: this.tangents
      }
    };
  }
}
