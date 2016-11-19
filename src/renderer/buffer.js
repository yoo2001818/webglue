export default class Buffer {
  constructor(renderer, data, usage) {
    this.renderer = renderer;
    this.data = data;
    if (Array.isArray(data)) {
      this.data = new Float32Array(data);
    }
    this.usage = usage == null ? renderer.gl.STATIC_DRAW : usage;
    this.vbo = null;
  }
  update(data) {
    this.data = data;
    if (Array.isArray(data)) {
      this.data = new Float32Array(data);
    }
    this.upload();
  }
  updateSub(data, offset) {
    if (this.vbo == null) this.upload();
    // Update subdata...
    this.data.set(data, offset);
    const gl = this.renderer.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, offset * 4, data);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  upload() {
    const gl = this.renderer.gl;
    if (this.vbo == null) this.vbo = gl.createBuffer();
    // Upload whole data... Nothing special
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.data, this.usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  dispose() {
    const gl = this.renderer.gl;
    if (this.buffer == null) return;
    gl.deleteBuffer(this.vbo);
    this.buffer = null;
  }
}
