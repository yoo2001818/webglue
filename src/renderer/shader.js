export default class Shader {
  constructor(renderer, vert, frag) {
    this.renderer = renderer;
    this.source = { vert, frag };
    this.program = null;
    this.attributes = {};
    this.uniforms = {};
    this.uniformTypes = {};
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
    this.uniformTypes = {};

    // Load program information
    let attributeSize = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attributeSize; ++i) {
      let attribute = gl.getActiveAttrib(program, i);
      let name = attribute.name;
      this.attributes[name] = gl.getAttribLocation(program, name);
    }

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
          this._addUniform(newName, typeId, location);
        }
      } else {
        let location = gl.getUniformLocation(program, name);
        this._addUniform(name, typeId, location);
      }
    }
  }
  _addUniform(name, typeId, location) {
    // Support raw string (.[] is reserved anyway)
    this.uniforms[name] = location;
    this.uniformTypes[name] = typeId;
    let parent = this.uniforms;
    let parentTypes = this.uniformTypes;
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
          parentTypes[parentField] = [];
        }
        parent = parent[parentField];
        parentTypes = parentTypes[parentField];

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
          parentTypes[parentField] = {};
        }
        parent = parent[parentField];
        parentTypes = parentTypes[parentField];

        parentArray = false;
      } else {
        let fieldName = truncName;

        let parentField = parentArray ? parentIndex : fieldName;
        if (parent[parentField] == null) {
          parent[parentField] = {};
          parentTypes[parentField] = {};
        }
        parent[parentField] = location;
        parentTypes[parentField] = typeId;

        hasFinished = true;
      }
    } while (!hasFinished);
  }
  use() {
    const gl = this.renderer.gl;
    if (this.program === null) this.upload();
    gl.useProgram(this.program);
  }
  setUniforms(originalValues,
    uniforms = this.uniforms,
    uniformTypes = this.uniformTypes
  ) {
    let values = originalValues;
    if (typeof originalValues === 'function') {
      values = originalValues(this, this.renderer);
    }
    if (typeof uniformTypes === 'number') {
      return this.setUniform(values, uniforms, uniformTypes);
    }
    if (Array.isArray(values)) {
      for (let i = 0; i < values; ++i) {
        if (uniforms[i] == null) continue;
        this.setUniforms(values[i], uniforms, uniformTypes);
      }
    } else {
      for (let i in values) {
        if (uniforms[i] == null) continue;
        this.setUniforms(values[i], uniforms, uniformTypes);
      }
    }
  }
  setUniform(value, key, type) {
    const gl = this.renderer.gl;
    if (key == null) return;
    switch (type) {
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
      // TODO Apply texture...
      // gl.uniform1i(key, this.useTexture(value));
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
