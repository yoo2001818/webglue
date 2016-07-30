import Material from '../../material';
import Shader from '../../shader';

// Bit mask of shader features.
const SHADER_FEATURES = {
  specularMap: 1,
  diffuseMap: 2,
  emissionMap: 4,
  normalMap: 8,
  heightMap: 16
};
// Append data of shader features.
const SHADER_APPENDS = {
  specularMap: '#define USE_SPECULAR_MAP',
  diffuseMap: '#define USE_DIFFUSE_MAP',
  emissionMap: '#define USE_EMISSION_MAP',
  normalMap: '#define USE_NORMAL_MAP',
  heightMap: '#define USE_HEIGHT_MAP'
};
// Processed shader instances.
const SHADER_INSTANCES = [];

const VERT_SHADER = require('../shader/phong.vert');
const FRAG_SHADER = require('../shader/phong.frag');

function attachAppendage(code, appendage) {
  // Find #version and skip it.
  let versionPos = code.indexOf('#version');
  let newLinePos = code.indexOf('\n', versionPos);
  return code.slice(0, newLinePos + 1) + appendage + code.slice(newLinePos + 1);
}

function retrieveShader(options) {
  // Calculate bit mask.
  let bitMask = 0;
  for (let name in SHADER_FEATURES) {
    if (options[name] == null) continue;
    bitMask |= SHADER_FEATURES[name];
  }
  if (SHADER_INSTANCES[bitMask] != null) return SHADER_INSTANCES[bitMask];
  let appendage = '';
  for (let name in SHADER_APPENDS) {
    if (options[name] == null) continue;
    appendage += SHADER_APPENDS[name] + '\n';
  }
  // Appendage is placed on the top; this might be a problem. or not.
  let shader = new Shader(
    VERT_SHADER,
    FRAG_SHADER
  );
  shader.appendage = appendage;
  shader.getVertexShader = function() {
    return attachAppendage(this.vertex, this.appendage);
  };
  shader.getFragmentShader = function() {
    return attachAppendage(this.fragment, this.appendage);
  };
  SHADER_INSTANCES[bitMask] = shader;
  return shader;
}

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
