import Shader from './shader';
import attachAppendage from '../util/attachAppendage';

const HEADER_PATTERN =
  /^\s*#pragma webglue: ([a-z]+)\(([^\),]+)(?:,\s*([^\)]+))*\)\s*$/gm;

function parseMetadata(code) {
  let output = {
    features: {},
    counts: {},
    capabilities: {}
  };
  let match;
  HEADER_PATTERN.lastIndex = 0;
  while ((match = HEADER_PATTERN.exec(code)) != null) {
    switch (match[1]) {
    case 'feature':
      if (output.features[match[3]] == null) output.features[match[3]] = [];
      output.features[match[3]].push(match[2]);
      break;
    case 'count':
      // TODO Implement non-exact match
      if (output.counts[match[3]] == null) output.counts[match[3]] = [];
      output.counts[match[3]].push(match[2]);
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
      categoryData[key] = { frag: fragData[key] };
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

    this.metadata = flattenMetadata(mergeMetadata(parseMetadata(vert),
      parseMetadata(frag)));
    this.useFeatures = Object.keys(this.metadata.features).length !== 0;
    this.useCounts = Object.keys(this.metadata.counts).length !== 0;
    // Shaders tree structure: { [flags]: [{counts: ..., shader}, ...], ...}
    // What if there is no 'feature'? It'll fallback to array.
    // What if there is no 'count'? It'll fallback to raw shader object.
    this.shaders = null;
  }
  use(uniforms, current) {
    if (this.useFeatures) {
      if (this.shaders == null) this.shaders = {};
      let vertDefines = [];
      let fragDefines = [];
      // Build current feature map
      let featureKey = this.metadata.features.map(v => {
        if (uniforms[v.key]) {
          vertDefines.push.apply(vertDefines, v.vert || []);
          fragDefines.push.apply(fragDefines, v.frag || []);
          return 'o';
        } else {
          return 'x';
        }
      }).join('');
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
            return uniforms[v.key].length === entry.uniforms[v.key];
          });
        });
        if (match == null) {
          let uniformData = {};
          this.metadata.counts.forEach(v => {
            vertDefines.push.apply(vertDefines,
              (v.vert || []).map(field => field + ' ' +
                uniforms[v.key].length));
            fragDefines.push.apply(fragDefines,
              (v.frag || []).map(field => field + ' ' +
                uniforms[v.key].length));
            uniformData[v.key] = uniforms[v.key].length;
          });
          // Create the shader
          let vertStr = vertDefines.map(v => `#define ${v}\n`).join('');
          let fragStr = fragDefines.map(v => `#define ${v}\n`).join('');
          let shader = new Shader(this.renderer,
            attachAppendage(this.source.vert, vertStr),
            attachAppendage(this.source.frag, fragStr)
          );
          selected.push({shader, uniforms: uniformData});
          return shader.use(uniforms, current);
        } else {
          return match.shader.use(uniforms, current);
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
          this.shaders[featureKey] = shader;
        }
        let selected = this.shaders[featureKey];
        return selected.use(uniforms, current);
      }
    } else {
      if (this.shaders == null) {
        this.shaders = new Shader(this.renderer,
          this.source.vert, this.source.frag);
      }
      return this.shaders.use(uniforms, current);
    }
    // TODO Implement useCounts
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
        this.shaders.dispose();
      }
    }
  }
}
