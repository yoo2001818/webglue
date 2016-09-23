import { mat4, vec3, quat } from 'gl-matrix';
export default class Transform {
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
    this.get();

    this.get = this.get.bind(this);
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
}
