import attachAppendage from './attachAppendage';
import Shader from '../shader';

function buildBitMask(features) {
  let id = 1;
  let output = {};
  for (let key in features) {
    output[key] = id;
    id = id << 1;
  }
  return output;
}

export default function featureShader(features, vert, frag) {
  // Build bit mask...
  let bitIds = buildBitMask(features);
  let instances = {};
  return (options) => {
    // Calculate bit mask.
    let bitMask = 0;
    for (let name in bitIds) {
      if (options[name] == null) continue;
      bitMask |= bitIds[name];
    }
    if (instances[bitMask] != null) return instances[bitMask];
    let appendage = '';
    for (let name in features) {
      if (options[name] == null) continue;
      appendage += features[name] + '\n';
    }
    // Appendage is placed on the top; this might be a problem. or not.
    let shader = new Shader(vert, frag);
    shader.appendage = appendage;
    shader.getVertexShader = function(lights) {
      return attachAppendage(this.vertex, this.appendage + lights);
    };
    shader.getFragmentShader = function(lights) {
      return attachAppendage(this.fragment, this.appendage + lights);
    };
    instances[bitMask] = shader;
    return shader;
  };
}
