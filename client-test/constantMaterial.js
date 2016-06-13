import Material from '../src/material';
import Shader from '../src/shader';

// This is copied from PhongMaterial. TODO Export these function to reuse it
const SHADER_FEATURES = {
  diffuseMap: 1
};
// Append data of shader features.
const SHADER_APPENDS = {
  diffuseMap: '#define USE_DIFFUSE_MAP'
};
// Processed shader instances.
const SHADER_INSTANCES = [];

const VERT_SHADER = require('./shader/constant.vert');
const FRAG_SHADER = require('./shader/constant.frag');

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
