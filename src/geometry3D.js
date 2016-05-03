import Geometry from './geometry';

import { vec3 } from 'gl-matrix';

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
      // Done! Paste them to those three vertices.
      this.normals.set(uv, vertexId1 * 3);
      this.normals.set(uv, vertexId2 * 3);
      this.normals.set(uv, vertexId3 * 3);
    }
  }
  // Recalculate tangents. This is experimental algorithm, so it may be
  // changed later.
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
      // I'm not sure if this is okay....
      vec3.subtract(p1, this.vertices.slice(vertexId2 * 3, vertexId2 * 3 + 3),
        origin);
      // Done! Paste them to those three vertices.
      this.tangents.set(p1, vertexId1 * 3);
      this.tangents.set(p1, vertexId2 * 3);
      this.tangents.set(p1, vertexId3 * 3);
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
