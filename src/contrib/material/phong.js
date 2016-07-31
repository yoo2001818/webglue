import Material from '../../material';
import featureShader from '../../util/featureShader';

let retrieveShader = featureShader({
  specularMap: '#define USE_SPECULAR_MAP',
  diffuseMap: '#define USE_DIFFUSE_MAP',
  emissionMap: '#define USE_EMISSION_MAP',
  normalMap: '#define USE_NORMAL_MAP',
  heightMap: '#define USE_HEIGHT_MAP'
}, require('../shader/phong.vert'), require('../shader/phong.frag'));

export default class PhongMaterial extends Material {
  constructor(options) {
    // Process features and retrieve (or generate) the shader.
    super(retrieveShader(options));
    this.options = options;
    if (this.options.heightMap) {
      this.heightMapScale = new Float32Array([
        this.options.heightMapScale, this.options.heightMapDecay
      ]);
    }
  }
  use() {
    return {
      uSpecularMap: this.options.specularMap,
      uDiffuseMap: this.options.diffuseMap,
      uEmissionMap: this.options.emissionMap,
      uNormalMap: this.options.normalMap,
      uHeightMap: this.options.heightMap,
      uHeightMapScale: this.heightMapScale,
      uMaterial: this.options
    };
  }
}
