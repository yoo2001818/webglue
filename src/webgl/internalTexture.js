export default class InternalTexture {
  constructor() {
    this.texture = null;
    this.name = null;
    this.type = null;
    this.loaded = false;
    this.lastUsed = 0;
    this.unitId = -1;
  }
  upload(context, texture) {
    const gl = context.gl;
    this.name = texture.name;
    this.type = texture.type === '2d' ? gl.TEXTURE_2D : gl.TEXTURE_CUBE_MAP;
    // Create texture
    this.texture = gl.createTexture();
    this.loaded = false;
    this.lastUsed = 0;
  }
  load(context, texture, unit) {
    const gl = context.gl;
    if (!this.loaded && texture.isLoaded()) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(this.type, this.texture);
      texture.upload(gl);
      this.loaded = true;
    }
  }
  use(context, texture, unit) {
    const gl = context.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(this.type, this.texture);
    if (!this.loaded && texture.isLoaded()) {
      texture.upload(gl);
      this.loaded = true;
    }
  }
  dispose(context) {
    const gl = context.gl;
    gl.deleteTexture(this.texture);
  }
}
