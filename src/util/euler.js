import { mat3 as Mat3, quat as Quat, vec3 } from 'gl-matrix';

const MAT3_BUFFER = Mat3.create();

export function quatToEuler(out, quat) {
  let mat = Mat3.fromQuat(MAT3_BUFFER, quat);
  let x, y, z;
  z = Math.asin(Math.min(1, Math.max(-1, mat[1])));
  if (Math.abs(mat[1]) < 0.99999) {
    x = Math.atan2(-mat[7], mat[4]);
    y = Math.atan2(-mat[2], mat[0]);
  } else {
    x = 0;
    y = Math.atan2(mat[6], mat[8]);
  }
  return vec3.set(out, x, y, z);
}
export function eulerToQuat(out, euler) {
  Quat.identity(out);
  Quat.rotateY(out, out, euler[1]);
  Quat.rotateZ(out, out, euler[2]);
  return Quat.rotateX(out, out, euler[0]);
}
