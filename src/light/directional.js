import Light from './light';
import { vec4 } from 'gl-matrix';

export default class DirectionalLight extends Light {
  constructor(options) {
    super('directional');
    this.options = options;
  }
  use() {
    let direction = vec4.fromValues(-1, 0, 0, 0);
    vec4.transformMat4(direction, direction, this.globalMatrix);
    vec4.normalize(direction, direction);
    direction = direction.subarray(0, 3);
    return {
      direction,
      color: this.options.color,
      intensity: new Float32Array([
        this.options.ambient, this.options.diffuse, this.options.specular,
        0
      ])
    };
  }
}
