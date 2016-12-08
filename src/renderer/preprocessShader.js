import Shader from './shader';
import attachAppendage from '../util/attachAppendage';

const HEADER_PATTERN =
  /^\s*#pragma webglue: ([a-z]+)\((([^\),]+)(,\s*(?:[^\),]+))*)\)\s*$/gm;

function parseMetadata(code, governors) {
  let output = {
    features: {},
    counts: {}
  };
  let match;
  HEADER_PATTERN.lastIndex = 0;
  while ((match = HEADER_PATTERN.exec(code)) != null) {
    let args = match[2].split(/,\s*/g);
    switch (match[1]) {
    case 'feature':
      if (output.features[args[1]] == null) output.features[args[1]] = [];
      output.features[args[1]].push(args[0]);
      break;
    case 'count':
      if (output.counts[args[1]] == null) {
        output.counts[args[1]] = {
          governor: governors[args[2]] || governors.equal,
          defines: []
        };
      }
      output.counts[args[1]].defines.push(args[0]);
      break;
    // TODO other stuff
    default:
      throw new Error('Unknown webglue pragma ' + match[1]);
    }
  }
  return output;
}

function mergeMetadata(vert, frag) {
  let output = {};
  // Categories are same for both vertex and fragment shader
  for (let category in vert) {
    let categoryData = (output[category] = {});
    let vertData = vert[category];
    let fragData = frag[category];
    for (let key in vertData) {
      categoryData[key] = { vert: vertData[key] };
    }
    for (let key in fragData) {
      if (categoryData[key] == null) categoryData[key] = {};
      categoryData[key].frag = fragData[key];
    }
  }
  return output;
}

function flattenMetadata(metadata) {
  let output = {};
  for (let category in metadata) {
    output[category] = Object.keys(metadata[category]).map(key =>
      Object.assign({}, metadata[category][key], { key }));
  }
  return output;
}

export default class PreprocessShader {
  constructor(renderer, vert, frag) {
    this.renderer = renderer;
    this.source = { vert, frag };

    let governors = this.renderer.shaders.governors;

    this.metadata = flattenMetadata(mergeMetadata(
      parseMetadata(vert, governors), parseMetadata(frag, governors)));
    this.useFeatures = this.metadata.features.length !== 0;
    this.useCounts = this.metadata.counts.length !== 0;
    this.invalidators = [];
    if (this.useFeatures) {
      this.metadata.features.forEach(v => {
        this.invalidators.push(v.key);
      });
    }
    if (this.useCounts) {
      this.metadata.counts.forEach(v => {
        this.invalidators.push(v.key);
      });
    }
    this.dirty = true;
    this.currentShader = null;
    this.currentUniforms = {};
    this.currentNode = null;
    // Shaders tree structure: { [flags]: [{counts: ..., shader}, ...], ...}
    // What if there is no 'feature'? It'll fallback to array.
    // What if there is no 'count'? It'll fallback to raw shader object.
    this.shaders = null;
    // ...
    this.frustumCull = vert.indexOf('#pragma webglue: frustumCull\n') !== -1;
  }
  ascendNode(node) {
    let uniforms = node.data.uniforms;
    if (uniforms == null) return;
    this.invalidators.forEach(key => {
      if (uniforms[key] !== undefined) {
        if (node.parent == null) {
          this.currentUniforms[key] = null;
        } else {
          this.currentUniforms[key] = node.parent.getUniform(key);
        }
        this.dirty = true;
      }
    });
  }
  descendNode(node) {
    let uniforms = node.data.uniforms;
    if (uniforms == null) return;
    this.invalidators.forEach(key => {
      if (uniforms[key] !== undefined) {
        // TODO Check if count/feature is still valid
        this.currentUniforms[key] = uniforms[key];
        this.dirty = true;
      }
    });
  }
  getShader(uniforms = this.currentUniforms) {
    if (uniforms === this.currentUniforms && !this.dirty) {
      return this.currentShader;
    }
    this.dirty = false;
    if (this.useFeatures) {
      if (this.shaders == null) this.shaders = {};
      let vertDefines = [];
      let fragDefines = [];
      // Build current feature map
      let featureKey = this.metadata.features.reduce((prev, v) => {
        if (uniforms[v.key]) {
          vertDefines.push.apply(vertDefines, v.vert || []);
          fragDefines.push.apply(fragDefines, v.frag || []);
          return (prev << 1) + 1;
        } else {
          return prev << 1;
        }
      }, 0);
      if (this.useCounts) {
        let selected;
        if (this.shaders[featureKey] == null) {
          selected = this.shaders[featureKey] = [];
        } else {
          selected = this.shaders[featureKey];
        }
        // Scan the counts list and find good match
        // TODO This is too costy and bad
        let match = selected.find(entry => {
          return this.metadata.counts.every(v => {
            let governor = (v.vert && v.vert.governor) ||
              (v.frag && v.frag.governor);
            return governor.checker(entry.uniforms[v.key], uniforms[v.key]);
          });
        });
        if (match == null) {
          let uniformData = {};
          this.metadata.counts.forEach(v => {
            let governor = (v.vert && v.vert.governor) ||
              (v.frag && v.frag.governor);
            let value = governor.allocator(uniforms[v.key]);
            vertDefines.push.apply(vertDefines,
              ((v.vert && v.vert.defines) || []).map(field => field + ' ' +
                value));
            fragDefines.push.apply(fragDefines,
              ((v.frag && v.frag.defines) || []).map(field => field + ' ' +
                value));
            uniformData[v.key] = value;
          });
          // Create the shader
          let vertStr = vertDefines.map(v => `#define ${v}\n`).join('');
          let fragStr = fragDefines.map(v => `#define ${v}\n`).join('');
          let shader = new Shader(this.renderer,
            attachAppendage(this.source.vert, vertStr),
            attachAppendage(this.source.frag, fragStr)
          );
          shader.parent = this;
          selected.push({shader, uniforms: uniformData});
          this.currentShader = shader;
          return shader;
        } else {
          this.currentShader = match.shader;
          return match.shader;
        }
      } else {
        if (this.shaders[featureKey] == null) {
          // Create the shader
          let vertStr = vertDefines.map(v => `#define ${v}\n`).join('');
          let fragStr = fragDefines.map(v => `#define ${v}\n`).join('');
          let shader = new Shader(this.renderer,
            attachAppendage(this.source.vert, vertStr),
            attachAppendage(this.source.frag, fragStr)
          );
          shader.parent = this;
          this.shaders[featureKey] = shader;
        }
        let selected = this.shaders[featureKey];
        this.currentShader = selected;
        return selected;
      }
    } else {
      if (this.shaders == null) {
        this.shaders = new Shader(this.renderer,
          this.source.vert, this.source.frag);
        this.shaders.parent = this;
      }
      this.currentShader = this.shaders;
      return this.shaders;
    }
  }
  use(uniforms, current) {
    let shader = this.getShader(uniforms);
    return shader.use(uniforms, current);
  }
  dispose() {
    // Dispose all shader objects. This is awkward since we have to write
    // the same code twice.
    if (this.useFeatures) {
      for (let key in this.shaders) {
        if (this.useCounts) {
          this.shaders[key].forEach(v => v.shader.dispose());
        } else {
          this.shaders[key].dispose();
        }
      }
    } else {
      if (this.useCounts) {
        this.shaders.forEach(v => v.shader.dispose());
      } else {
        if (this.shaders != null) this.shaders.dispose();
      }
    }
  }
}
