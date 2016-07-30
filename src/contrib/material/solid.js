import Material from '../../material';
import Shader from '../../shader';

const SOLID_SHADER = new Shader(
  require('../shader/solid.vert'), require('../shader/solid.frag')
);

export default class SolidMaterial extends Material {
  constructor(options) {
    super(SOLID_SHADER);
    this.options = options;
  }
  use() {
    return {
      uMaterial: this.options
    };
  }
}
