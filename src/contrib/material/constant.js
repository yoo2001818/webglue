import Material from '../../material';
import featureShader from '../../util/featureShader';

let retrieveShader = featureShader({
  diffuseMap: '#define USE_DIFFUSE_MAP'
}, require('../shader/constant.vert'), require('../shader/constant.frag'));

export default class ConstantMaterial extends Material {
  constructor(options) {
    // Process features and retrieve (or generate) the shader.
    super(retrieveShader(options));
    this.options = options;
  }
  use() {
    return {
      uDiffuseMap: this.options.diffuseMap,
      uMaterial: this.options
    };
  }
}
