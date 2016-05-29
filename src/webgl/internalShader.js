export default class InternalShader {
  constructor() {
    this.isShared = true;
    this.name = null;
    this.attributes = {};
    this.uniforms = {};
    this.uniformTypes = {};
  }
  upload(context, shader) {
    const gl = context.gl;
    this.name = shader.name;
    // Compile shaders
    this.vertexShader = compileShader(gl, shader.vertex, gl.VERTEX_SHADER);
    this.fragmentShader = compileShader(gl, shader.fragment,
      gl.FRAGMENT_SHADER);
    // Link shaders
    let program = gl.createProgram();
    // Bind vertex index (mandatory for sharing attribs)
    for (let attribute in context.sharedAttributes) {
      gl.bindAttribLocation(program, context.sharedAttributes[attribute],
        attribute);
    }
    gl.attachShader(program, this.vertexShader);
    gl.attachShader(program, this.fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) &&
      !gl.isContextLost()
    ) {
      throw new Error('Shader program linking failed: ' +
        gl.getProgramInfoLog(program));
    }
    // Clean up the shaders
    /* gl.detachShader(program, this.vertexShader);
    gl.detachShader(program, this.fragmentShader);
    gl.deleteShader(this.vertexShader);
    gl.deleteShader(this.fragmentShader); */
    this.program = program;
    this.attributes = {};
    this.uniforms = {};
    this.uniformTypes = {};
    this.isShared = true;
    // Load program information
    let attributeSize = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attributeSize; ++i) {
      let attribute = gl.getActiveAttrib(program, i);
      let name = attribute.name;
      this.attributes[name] = gl.getAttribLocation(program, name);
      // console.log(name, this.attributes[name], i);
      // Trigger non-shared shader if attribute cannot be found in shared
      // attribute object
      if (context.sharedAttributes[name] == null) {
        console.log('SharedAttribute fail');
        this.isShared = false;
      }
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
          this.addUniform(newName, typeId, location);
        }
      } else {
        let location = gl.getUniformLocation(program, name);
        this.addUniform(name, typeId, location);
      }
    }
  }
  addUniform(name, typeId, location) {
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
  use(context) {
    const gl = context.gl;
    gl.useProgram(this.program);
  }
  dispose(context) {
    // Nothing to do yet
    const gl = context.gl;
    gl.deleteProgram(this.program);
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
