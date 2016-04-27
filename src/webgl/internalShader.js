export default class InternalShader {
  constructor() {
    this.isShared = true;
    this.name = null;
    this.attributes = {};
    this.uniforms = {};
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
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
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
    this.isShared = true;
    // Load program information
    let attributeSize = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attributeSize; ++i) {
      let attribute = gl.getActiveAttrib(program, i);
      let name = attribute.name;
      this.attributes[name] = gl.getAttribLocation(program, name);
      console.log(name, this.attributes[name], i);
      // Trigger non-shared shader if attribute cannot be found in shared
      // attribute object
      if (context.sharedAttributes[name] == null) {
        console.log('SharedAttribute fail');
        this.isShared = false;
      }
    }
    let uniformSize = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformSize; ++i) {
      let uniform = gl.getActiveUniform(program, i);
      let name = uniform.name;
      this.uniforms[name] = gl.getUniformLocation(program, name);
      console.log(name, this.uniforms[name], i);
    }
  }
  use(context) {
    const gl = context.gl;
    gl.useProgram(this.program);
  }
  dispose(context) {
    // Nothing to do yet
  }
}

function compileShader(gl, data, type) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, data);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error('Shader compilation failed: ' +
      gl.getShaderInfoLog(shader));
  }
  return shader;
}
