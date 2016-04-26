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
      vec3.subtract(uv, p1, p2);
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
  upload(gl) {
    if (this.vertices === null) throw new Error('Vertices array is null');
    if (this.normals === null) throw new Error('Normals array is null');
    if (this.texCoords === null) throw new Error('Texture coord array is null');
    if (this.tangents === null) throw new Error('Tangents array is null');
    if (this.vertices.length !== this.normals.length) {
      throw new Error('Vertices and normals array size does not match');
    }
    if (this.vertices.length / 3 !== this.texCoords.length / 2) {
      throw new Error('Vertices and texture coords array size does not match');
    }
    const vertexCount = this.getVertexCount();
    // Assign the buffer.
    // Since this class assumes the geometry is buffered only once, it is right
    // to use STATIC_DRAW.
    // Each vertex consumes 44 bytes (that's a lot). Every float is 4 bytes,
    // and there is position (vec3), texCoords (vec2), normals (vec3).
    // plus tangent (vec3).
    gl.bufferData(gl.ARRAY_BUFFER, vertexCount * 44, gl.STATIC_DRAW);
    // Upload data to the buffer.
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
    gl.bufferSubData(gl.ARRAY_BUFFER, vertexCount * 12, this.normals);
    gl.bufferSubData(gl.ARRAY_BUFFER, vertexCount * 24, this.tangents);
    gl.bufferSubData(gl.ARRAY_BUFFER, vertexCount * 36, this.texCoords);
  }
  use(gl, shader) {
    // InternalGeometry will handle VAO and VBO section; we just need to
    // bind the array to the attributes.
    const attributes = shader.attributes;
    const vertexCount = this.getVertexCount();
    if (attributes.vertex !== -1) {
      gl.enableVertexAttribArray(attributes.vertex);
      gl.vertexAttribPointer(attributes.vertex, 3, gl.FLOAT, false, 12, 0);
    }
    if (attributes.normal !== -1) {
      gl.enableVertexAttribArray(attributes.normal);
      gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 12,
        vertexCount * 12);
    }
    if (attributes.tangent !== -1) {
      gl.enableVertexAttribArray(attributes.tangent);
      gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 12,
        vertexCount * 24);
    }
    if (attributes.texCoord !== -1) {
      gl.enableVertexAttribArray(attributes.texCoord);
      gl.vertexAttribPointer(attributes.normal, 2, gl.FLOAT, false, 8,
        vertexCount * 36);
    }
  }
}
