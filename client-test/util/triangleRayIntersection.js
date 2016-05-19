// Moller–Trumbore ray-triangle intersection algorithm

import { vec3 } from 'gl-matrix';

/**
 * @param v1 Triangle vertices
 * @param v2
 * @param v3
 * @param o Ray origin
 * @param d Ray direction
 */
export default function triangleRayIntersection(v1, v2, v3, o, d) {
  // Triangle edge
  let e1 = vec3.create(), e2 = vec3.create();
  vec3.subtract(e1, v2, v1);
  vec3.subtract(e2, v3, v1);

  let p = vec3.create();
  vec3.cross(p, d, e2);

  let det = vec3.dot(e1, p);
  // Back culling
  if (det < 0.00001) return false;
  let invDet = 1 / det;

  let t = vec3.create();
  vec3.subtract(t, o, v1);

  let u = vec3.dot(t, p) * invDet;
  if (u < 0 || u > 1) return false;

  let q = vec3.create();
  vec3.cross(q, t, e1);

  let v = vec3.dot(d, q) * invDet;
  if (v < 0 || (u + v) > 1) return false;

  let distance = vec3.dot(e2, q) * invDet;
  if (distance > 0.00001) return distance;
  return false;
}
