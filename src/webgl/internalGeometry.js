const SHARED_ATTRIBUTES = Symbol('shared_attributes');

export default class InternalGeometry {
  constructor() {
    this.vbo = null;
    this.ebo = null;
    this.eboType = 0;
    this.type = 0;
    this.vao = {};
    this.name = null;
  }
  upload(context, geometry) {
    const gl = context.gl;
    switch (geometry.type) {
    case 'triangles':
      this.type = gl.TRIANGLES;
      break;
    case 'lines':
      this.type = gl.LINES;
      break;
    case 'points':
    default:
      this.type = gl.POINTS;
      break;
    }
    this.name = geometry.name;
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    geometry.upload(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    if (geometry.indices) {
      if (geometry.indices instanceof Uint8Array) {
        this.eboType = gl.UNSIGNED_BYTE;
      } else if (geometry.indices instanceof Uint16Array) {
        this.eboType = gl.UNSIGNED_SHORT;
      } else if (geometry.indices instanceof Uint32Array) {
        // TODO OES_element_index_uint extension must be enabled before doing
        // this
        // this.eboType = gl.UNSIGNED_INT;
        throw new Error('Uint32Array indices is not supported yet');
      } else {
        throw new Error('Unsupported indices array type');
      }
      this.ebo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
  }
  use(context, geometry) {
    const gl = context.gl;
    const shader = context.currentShader;
    const name = shader.isShared ? SHARED_ATTRIBUTES : shader.name;
    if (this.type === gl.LINES && geometry.lineWidth != null) {
      gl.lineWidth(geometry.lineWidth);
    }
    // If VAO extension exists, try to use it
    if (context.vaoExt) {
      // If VAO exists, just bind it and return
      if (this.vao[name]) {
        context.vaoExt.bindVertexArrayOES(this.vao[name]);
        return;
      } else {
        // If it doesn't, create new one and proceed
        let vao = context.vaoExt.createVertexArrayOES();
        context.vaoExt.bindVertexArrayOES(vao);
        this.vao[name] = vao;
      }
    }
    const attributes = shader.isShared ? context.sharedAttributes :
      shader.attributes;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    geometry.use(gl, attributes);
  }
  render(context, geometry) {
    const gl = context.gl;
    if (this.ebo !== null) {
      // Draw by elements if indices buffer exists
      gl.drawElements(this.type, geometry.indices.length, this.eboType, 0);
    } else {
      // Or just use array drawing
      gl.drawArrays(this.type, 0, geometry.getVertexCount());
    }
  }
  dispose(context) {
    // TODO
  }
}
