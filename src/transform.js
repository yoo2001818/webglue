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

    this.matrix = mat4.create();
    this.valid = false;
    this.ticks = 0;
    this.validate();

    this.get = this.get.bind(this);
  }
  get() {
    return this.validate();
  }
  validate() {
    if (this.valid) return this.matrix;
    // Recalculate transform matrix
    mat4.fromRotationTranslation(this.matrix, this.rotation, this.position);
    mat4.scale(this.matrix, this.matrix, this.scale);
    this.valid = true;
    this.ticks ++;
    return this.matrix;
  }
  invalidate() {
    this.valid = false;
  }
}
