// Handles collision with a geometry object.

import triangleRayIntersection from './triangleRayIntersection';

import { vec3 } from 'gl-matrix';

export default function geometryRayIntersection(geometry, matrix, o, d) {
  // Handle the triangle only
  if (geometry.type !== 'triangles') return false;
  let minFaceId = null;
  let minFaceDist = Infinity;
  // Geometry MUST be Geometry3D object
  let indices = geometry.getIndices();
  let vertices = geometry.getAttributes().aPosition;
  if (indices == null || vertices == null) return false;
  vertices = vertices.data;
  // TODO it'll be cheaper to cache each vertex.
  for (let faceId = 0; faceId < geometry.indices.length; faceId += 3) {
    const vertexId1 = indices[faceId];
    const vertexId2 = indices[faceId + 1];
    const vertexId3 = indices[faceId + 2];
    let vertex1 = vertices.slice(vertexId1 * 3, vertexId1 * 3 + 3);
    let vertex2 = vertices.slice(vertexId2 * 3, vertexId2 * 3 + 3);
    let vertex3 = vertices.slice(vertexId3 * 3, vertexId3 * 3 + 3);
    vec3.transformMat4(vertex1, vertex1, matrix);
    vec3.transformMat4(vertex2, vertex2, matrix);
    vec3.transformMat4(vertex3, vertex3, matrix);
    let dist = triangleRayIntersection(vertex1, vertex2, vertex3, o, d);
    if (dist !== false && dist < minFaceDist) {
      minFaceId = faceId;
      minFaceDist = dist;
    }
  }
  if (minFaceId === null) return null;
  return {
    faceId: minFaceId,
    distance: minFaceDist
  };
}
