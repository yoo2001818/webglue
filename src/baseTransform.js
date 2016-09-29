import { mat4, vec3, quat } from 'gl-matrix';
import { quatToEuler, eulerToQuat } from './util/euler';

let quatBuf = quat.create();

export default class BaseTransform {
  constructor(
    position = vec3.create(),
    rotation = quat.create(),
    scale = vec3.fromValues(1, 1, 1)
  ) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;

    this.localMatrix = mat4.create();
    this.valid = false;
    this.ticks = 0;
  }
  get() {
    if (this.valid) return this.localMatrix;
    // Recalculate transform matrix
    mat4.fromRotationTranslation(this.localMatrix, this.rotation,
      this.position);
    mat4.scale(this.localMatrix, this.localMatrix, this.scale);
    this.valid = true;
    this.ticks ++;
    return this.localMatrix;
  }
  invalidate() {
    this.valid = false;
  }
  identity() {
    vec3.set(this.position, 0, 0, 0);
    vec3.set(this.scale, 1, 1, 1);
    quat.identity(this.rotation);
  }
  setPos(position) {
    vec3.copy(this.position, position);
    this.invalidate();
  }
  translate(position) {
    vec3.add(this.position, this.position, position);
    this.invalidate();
  }
  setScale(scale) {
    vec3.copy(this.scale, scale);
    this.invalidate();
  }
  setAxisAngle(axis, radian) {
    quat.setAxisAngle(this.rotation, axis, radian);
    this.invalidate();
  }
  rotate(axis, radian) {
    quat.setAxisAngle(quatBuf, axis, radian);
    quat.multiply(this.rotation, quatBuf, this.rotation);
    this.invalidate();
  }
  rotateEuler(x, y, z) {
    eulerToQuat(quatBuf, [x, y, z]);
    quat.multiply(this.rotation, quatBuf, this.rotation);
    this.invalidate();
  }
  rotateX(radian) {
    quat.rotateX(this.rotation, this.rotation, radian);
    this.invalidate();
  }
  rotateY(radian) {
    quat.rotateY(this.rotation, this.rotation, radian);
    this.invalidate();
  }
  rotateZ(radian) {
    quat.rotateZ(this.rotation, this.rotation, radian);
    this.invalidate();
  }
  getEuler(out) {
    return quatToEuler(out, this.rotation);
  }
}
