import Material from '../src/material';
import Shader from '../src/shader';

const PHONG_SHADER = new Shader(
  require('./shader/phong.vert'), require('./shader/phong.frag')
);

export default class PhongMaterial extends Material {
  constructor(options) {
    super(PHONG_SHADER);
    this.options = options;
  }
  use() {
    return this.options;
  }
}
