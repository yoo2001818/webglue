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
      let vertFeatures = [];
      let fragFeatures = [];
      // Build current feature map
      let featureKey = this.metadata.features.map(v => {
        if (uniforms[v.key]) {
          vertFeatures = vertFeatures.concat(v.vert || []);
          fragFeatures = fragFeatures.concat(v.frag || []);
          return 'o';
        } else {
          return 'x';
        }
      }).join('');
      if (this.shaders[featureKey] == null) {
        // Create the shader
        let vertDefines = vertFeatures.map(v => `#define ${v}`).join('\n');
        let fragDefines = fragFeatures.map(v => `#define ${v}`).join('\n');
        let shader = new Shader(this.renderer,
          attachAppendage(this.source.vert, vertDefines),
          attachAppendage(this.source.frag, fragDefines)
        );
        this.shaders[featureKey] = shader;
      }
      let selected = this.shaders[featureKey];
      return selected.use(uniforms, current);
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
