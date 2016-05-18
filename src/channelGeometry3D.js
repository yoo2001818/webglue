import ChannelGeometry from './channelGeometry';

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
    // If there are more than 65536 vertices, we need to use Uint32Array.
    // (Since ChannelGeometry supports converting it, we don't need to care
    // about WebGL extension's presence.)
    let normalIndices = new Uint16Array(indices.length);
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
  // Calculate tangents per face.
  calculateTangents() {
    if (this.vertices === null) throw new Error('Vertices array is null');
    let posIndices = this.vertexIndices;
    if (posIndices == null) throw new Error('Position indices is null');
    let texIndices = this.texCoordIndices;
    if (texIndices == null) throw new Error('Texture indices is null');
    // One vec3 per one face. so indices / 3 * 3.
    let tangents = new Float32Array(posIndices.length);
    // If there are more than 65536 vertices, we need to use Uint32Array.
    // (Since ChannelGeometry supports converting it, we don't need to care
    // about WebGL extension's presence.)
    let tangentIndices = new Uint16Array(posIndices.length);
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
      let tangent = vec3.create();
      tangent[0] = f * (texP2[1] * p1[0] - texP1[1] * p2[0]);
      tangent[1] = f * (texP2[1] * p1[1] - texP1[1] * p2[1]);
      tangent[2] = f * (texP2[1] * p1[2] - texP1[1] * p2[2]);
      // Done. Store them in tangents buffer, and set indices to it.
      tangents.set(tangent, tangentId * 3);
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
        axis: 3,
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
