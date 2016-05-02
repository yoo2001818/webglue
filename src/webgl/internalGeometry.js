const SHARED_ATTRIBUTES = Symbol('shared_attributes');
// WebGL constants. It may cause cross-browser problems if constants are
// different between browsers, but they don't.
const TYPES = {
  points: 0,
  lines: 1,
  lineLoop: 2,
  lineStrip: 3,
  triangles: 4,
  triangleStrip: 5,
  triangleFan: 6
};

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
    if (Array.isArray(geometry.type)) {
      // If type is array, that means it's in 'separate' mode, which runs
      // render command multiple times.
      this.type = geometry.type.map(original => ({
        first: original.first,
        count: original.count,
        type: TYPES[original.type]
      }));
      this.typeArray = true;
    } else {
      // Just normal full rendering mode otherwise.
      this.type = TYPES[geometry.type];
      this.typeArray = false;
    }
    this.name = geometry.name;
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    geometry.upload(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    if (geometry.indices) {
      if (geometry.indices instanceof Uint8Array) {
        this.eboType = gl.UNSIGNED_BYTE;
        this.eboSize = 1;
      } else if (geometry.indices instanceof Uint16Array) {
        this.eboType = gl.UNSIGNED_SHORT;
        this.eboSize = 2;
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
    if (this.typeArray) {
      for (let i = 0; i < this.type.length; ++i) {
        let data = this.type[i];
        if (this.ebo !== null) {
          // Draw by elements if indices buffer exists
          // Note that offset accepts the BYTE index, not array index!
          // Since we're using Uint16, Uint8, ... we have to multiply the
          // byte size of it. Who made this thing??
          gl.drawElements(data.type, data.count, this.eboType,
            data.first * this.eboSize);
        } else {
          // Or just use array drawing
          gl.drawArrays(data.type, data.first, data.count);
        }
      }
    } else {
      if (this.ebo !== null) {
        // Draw by elements if indices buffer exists
        gl.drawElements(this.type, geometry.indices.length, this.eboType, 0);
      } else {
        // Or just use array drawing
        gl.drawArrays(this.type, 0, geometry.getVertexCount());
      }
    }
  }
  dispose(context) {
    // TODO
  }
}
