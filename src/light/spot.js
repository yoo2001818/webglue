import Light from './light';
import { vec3, vec4 } from 'gl-matrix';

export default class SpotLight extends Light {
  constructor(options) {
    super('spot');
    this.options = options;
  }
  use() {
    let direction = vec4.fromValues(-1, 0, 0, 0);
    vec4.transformMat4(direction, direction, this.globalMatrix);
    vec4.normalize(direction, direction);
    direction = direction.subarray(0, 3);
    let position = vec3.create();
    vec3.transformMat4(position, position, this.globalMatrix);
    return {
      position, direction,
      color: this.options.color,
      intensity: new Float32Array([
        this.options.ambient, this.options.diffuse, this.options.specular,
        this.options.attenuation
      ]),
      angle: new Float32Array([
        Math.cos(this.options.angleStart),
        Math.cos(this.options.angleEnd)
      ])
    };
  }
}
