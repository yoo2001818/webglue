import { mat4, vec3, quat } from 'gl-matrix';
export default class Transform {
  constructor() {
    this.position = vec3.create();
    this.rotation = quat.create();
    this.scale = vec3.create();
    vec3.set(this.scale, 1, 1, 1);
    this.matrix = mat4.create();
    this.valid = false;
    this.validate();
  }
  validate() {
    if (this.valid) return false;
    // Recalculate transform matrix
    mat4.fromRotationTranslation(this.matrix, this.rotation, this.position);
    mat4.scale(this.matrix, this.matrix, this.scale);
    this.valid = true;
    return true;
  }
  invalidate() {
    this.valid = false;
  }
}
