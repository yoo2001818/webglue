import { vec3, mat4 } from 'gl-matrix';

let tmpVec3 = vec3.create();
let tmpMat4 = mat4.create();
let tmpPlanes = new Float32Array(24);

function parseUniform(renderer, node, value) {
  if (typeof value === 'function') {
    return value(node.shader, renderer);
  }
  return value;
}

function setPlane(mat, column, sign, output, pos) {
  let x = mat[column] * sign + mat[3];
  let y = mat[column + 4] * sign + mat[7];
  let z = mat[column + 8] * sign + mat[11];
  let w = mat[column + 12] * sign + mat[15];
  let len = Math.sqrt(x * x + y * y + z * z);
  output[pos] = x / len;
  output[pos + 1] = y / len;
  output[pos + 2] = z / len;
  output[pos + 3] = w / len;
}

function distancePlane(plane, pos) {
  // :S
  return plane[0] * pos[0] + plane[1] * pos[1] + plane[2] * pos[2] + plane[3];
}

export default function checkFrustum(renderer, node) {
  // Prepare matrix
  // TODO Support custom uniform name
  let uModel = parseUniform(renderer, node, node.getUniform('uModel'));
  let uView = parseUniform(renderer, node, node.getUniform('uView'));
  let uProjection = parseUniform(renderer, node,
    node.getUniform('uProjection'));
  mat4.multiply(tmpMat4, uView, uModel);
  mat4.multiply(tmpMat4, uProjection, tmpMat4);
  setPlane(tmpMat4, 2, 1, tmpPlanes, 0); // Near
  setPlane(tmpMat4, 2, -1, tmpPlanes, 4); // Far
  setPlane(tmpMat4, 1, 1, tmpPlanes, 8); // Bottom
  setPlane(tmpMat4, 1, -1, tmpPlanes, 12); // Top
  setPlane(tmpMat4, 0, 1, tmpPlanes, 16); // Left
  setPlane(tmpMat4, 0, -1, tmpPlanes, 20); // Right
  // Prepare AABB
  let aabb = node.geometry.getAABB();
  for (let i = 0; i < 6; ++i) {
    // Pull plane
    let plane = tmpPlanes.subarray(i * 4, i * 4 + 4);
    tmpVec3[0] = plane[0] < 0 ? aabb[0] : aabb[3];
    tmpVec3[1] = plane[1] < 0 ? aabb[1] : aabb[4];
    tmpVec3[2] = plane[2] < 0 ? aabb[2] : aabb[5];
    if (distancePlane(plane, tmpVec3) < 0) return false;
  }
  return true;
}
