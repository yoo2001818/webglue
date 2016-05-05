import Light from './light';
import { vec3 } from 'gl-matrix';

export default class PointLight extends Light {
  constructor(options) {
    super('point');
    this.options = options;
  }
  use() {
    let position = vec3.create();
    vec3.transformMat4(position, position, this.globalMatrix);
    console.log(this.globalMatrix);
    console.log(position);
    return {
      position,
      color: this.options.color,
      intensity: new Float32Array([
        this.options.ambient, this.options.diffuse, this.options.specular,
        this.options.attenuation
      ])
    };
  }
}
