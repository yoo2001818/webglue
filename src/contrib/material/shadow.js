import Material from '../../material';
import Shader from '../../shader';

const SHADOW_SHADER = new Shader(
  require('../shader/shadow.vert'), require('../shader/shadow.frag')
);

export default class ShadowMaterial extends Material {
  constructor(options) {
    super(SHADOW_SHADER);
    this.options = options;
  }
  getShader() {
    return SHADOW_SHADER;
  }
}
