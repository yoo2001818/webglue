import parseUniform from '../util/parseUniform';

function compileShader(gl, data, type) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, data);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) &&
    !gl.isContextLost()
  ) {
    throw new Error('Shader compilation failed: ' +
      gl.getShaderInfoLog(shader));
  }
  return shader;
}

export default class Shader {
  constructor(renderer, vert, frag) {
    this.renderer = renderer;
    this.source = { vert, frag };
    // TODO This should allow dynamic pipeline.. or something.
    // This only does simple AABB though.
    this.frustumCull = vert.indexOf('#pragma webglue: frustumCull\n') !== -1;
    this.program = null;
    this.attributes = {};
    this.uniforms = {};
    this.uniformTypes = {};
    this.currentNode = null;
  }
  upload() {
    if (this.program !== null) return;
    const gl = this.renderer.gl;
    // Compile shaders
    this.shader = {
      vert: compileShader(gl, this.source.vert, gl.VERTEX_SHADER),
      frag: compileShader(gl, this.source.frag, gl.FRAGMENT_SHADER)
    };
    // Link shaders
    let program = gl.createProgram();
    // Use standard geometries if possible
    this.renderer.attributes.forEach((name, index) => {
      gl.bindAttribLocation(program, index, name);
    });
    gl.attachShader(program, this.shader.vert);
    gl.attachShader(program, this.shader.frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS) &&
      !gl.isContextLost()
    ) {
      throw new Error('Shader program linking failed: ' +
        gl.getProgramInfoLog(program));
    }

    // Clean up the shaders
    gl.detachShader(program, this.shader.vert);
    gl.detachShader(program, this.shader.frag);
    gl.deleteShader(this.shader.vert);
    gl.deleteShader(this.shader.frag);

    this.program = program;
    this.attributes = {};
    this.uniforms = {};

    // Load program information
    let attributeSize = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attributeSize; ++i) {
      let attribute = gl.getActiveAttrib(program, i);
      let name = attribute.name;
      this.attributes[name] = gl.getAttribLocation(program, name);
    }

    let textureId = 0;

    // Since uniform supports struct and array, this gets pretty tricky..
    let uniformSize = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformSize; ++i) {
      let uniform = gl.getActiveUniform(program, i);
      let { name, type: typeId, size } = uniform;
      if (size > 1) {
        // Array has been received - We have to process each uniform
        // manually, since uniform list only has one uniform representing
        // index 0.
        for (let i = 0; i < size; ++i) {
          // Something doesn't feel right about this. It works but it's weird.
          let newName = name.replace('[0]', '[' + i + ']');
          let location = gl.getUniformLocation(program, newName);
          let texturePos = null;
          if (typeId === gl.SAMPLER_2D || typeId === gl.SAMPLER_CUBE) {
            texturePos = textureId ++;
          }
          this._addUniform(newName, {
            name: newName,
            type: typeId,
            location: location,
            texture: texturePos
          });
        }
      } else {
        let location = gl.getUniformLocation(program, name);
        let texturePos = null;
        if (typeId === gl.SAMPLER_2D || typeId === gl.SAMPLER_CUBE) {
          texturePos = textureId ++;
        }
        this._addUniform(name, {
          name: name,
          type: typeId,
          location: location,
          texture: texturePos
        });
      }
    }
  }
  _addUniform(name, metadata) {
    // Support raw string (.[] is reserved anyway)
    this.uniforms[name] = metadata;
    let parent = this.uniforms;
    let parentArray = false;
    let parentIndex = null;
    let truncName = name;
    let hasFinished = false;
    do {
      // Check for array..
      let arrayStartLoc = truncName.indexOf('[');
      if (arrayStartLoc !== -1) {
        let arrayEndLoc = truncName.indexOf(']');
        let fieldName = truncName.slice(0, arrayStartLoc);
        let index = parseInt(truncName.slice(arrayStartLoc + 1, arrayEndLoc));
        truncName = truncName.slice(arrayEndLoc + 1);

        let parentField = parentArray ? parentIndex : fieldName;
        if (parent[parentField] == null) {
          parent[parentField] = [];
        }
        parent = parent[parentField];

        parentArray = true;
        parentIndex = index;
      }
      let objectStartLoc = truncName.indexOf('.');
      if (objectStartLoc !== -1) {
        let fieldName = truncName.slice(0, objectStartLoc);
        truncName = truncName.slice(objectStartLoc + 1);

        let parentField = parentArray ? parentIndex : fieldName;
        if (parent[parentField] == null) {
          parent[parentField] = {};
        }
        parent = parent[parentField];

        parentArray = false;
      } else {
        let fieldName = truncName;

        let parentField = parentArray ? parentIndex : fieldName;
        if (parent[parentField] == null) {
          parent[parentField] = {};
        }
        parent[parentField] = metadata;

        hasFinished = true;
      }
    } while (!hasFinished);
  }
  getShader() {
    return this;
  }
  use(uniforms, current) {
    const gl = this.renderer.gl;
    if (this.program === null) this.upload();
    if (current !== this) gl.useProgram(this.program);
    if (uniforms != null) this.setUniforms(uniforms);
    return this;
  }
  setUniforms(originalValues, uniforms = this.uniforms) {
    let values = originalValues;
    if (values === undefined) return;
    if (typeof originalValues === 'function') {
      values = originalValues(this, this.renderer);
    }
    // TODO We need to make sure that this is indeed a 'leaf' node,
    // otherwise we won't be able to use 'type' as a variable name
    if (typeof uniforms.type === 'number') {
      return this.setUniform(values, uniforms);
    }
    // Disable setting to 0 because it's meaningless.
    if (values === false) return;
    // Set all children to 0...
    /*
    if (values === false) {
      if (Array.isArray(uniforms)) {
        for (let i = 0; i < uniforms.length; ++i) {
          this.setUniforms(false, uniforms[i]);
        }
      } else {
        for (let i in uniforms) {
          this.setUniforms(false, uniforms[i]);
        }
      }
    }
    */
    if (Array.isArray(values)) {
      for (let i = 0; i < values.length; ++i) {
        if (uniforms[i] == null) continue;
        this.setUniforms(values[i], uniforms[i]);
      }
    } else {
      for (let i in values) {
        if (uniforms[i] == null) continue;
        this.setUniforms(values[i], uniforms[i]);
      }
    }
  }
  setUniform(val, metadata) {
    const gl = this.renderer.gl;
    let key = metadata.location;
    if (key == null) return;
    let value = parseUniform(gl, val, metadata.type);
    switch (metadata.type) {
    case gl.FLOAT_VEC2:
      gl.uniform2fv(key, value);
      break;
    case gl.FLOAT_VEC3:
      gl.uniform3fv(key, value);
      break;
    case gl.FLOAT_VEC4:
      gl.uniform4fv(key, value);
      break;
    case gl.INT_VEC2:
    case gl.BOOL_VEC2:
      gl.uniform2iv(key, value);
      break;
    case gl.INT_VEC3:
    case gl.BOOL_VEC3:
      gl.uniform3iv(key, value);
      break;
    case gl.INT_VEC4:
    case gl.BOOL_VEC4:
      gl.uniform4iv(key, value);
      break;
    case gl.BOOL:
    case gl.BYTE:
    case gl.UNSIGNED_BYTE:
    case gl.SHORT:
    case gl.UNSIGNED_SHORT:
    case gl.INT:
    case gl.UNSIGNED_INT:
      gl.uniform1i(key, value);
      break;
    case gl.FLOAT:
      gl.uniform1f(key, value);
      break;
    case gl.FLOAT_MAT2:
      gl.uniformMatrix2fv(key, false, value);
      break;
    case gl.FLOAT_MAT3:
      gl.uniformMatrix3fv(key, false, value);
      break;
    case gl.FLOAT_MAT4:
      gl.uniformMatrix4fv(key, false, value);
      break;
    case gl.SAMPLER_2D:
    case gl.SAMPLER_CUBE:
      // Call texture handler (if any)
      if (this.renderer.textures.handler != null) {
        value = this.renderer.textures.handler(value);
      }
      gl.uniform1i(key, this.renderer.textures.use(metadata.texture, value));
      break;
    }
  }
  dispose() {
    // Nothing to do yet
    const gl = this.renderer.gl;
    gl.deleteProgram(this.program);
    this.program = null;
  }
}
