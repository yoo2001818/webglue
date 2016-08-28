// Why don't we use an object? We don't know the constant value..
function getAttachment(gl, format) {
  // Doesn't support extension for now.
  switch (format) {
  case gl.RGBA4:
  case gl.RGB565:
  case gl.RGR5_A1:
    return gl.COLOR_ATTACHMENT0;
  case gl.DEPTH_COMPONENT16:
    return gl.DEPTH_ATTACHMENT;
  case gl.STENCIL_INDEX8:
    return gl.STENCIL_ATTACHMENT;
  case gl.DEPTH_STENCIL:
    return gl.DEPTH_STENCIL_ATTACHMENT;
  }
}

export default class Framebuffer {
  constructor(renderer, options) {
    this.renderer = renderer;
    this.options = options;

    this.framebuffer = null;
    // Renderbuffers
    this.color = null;
    this.depth = null;
    // this.stencil = null;
  }
  init() {
    const gl = this.renderer.gl;
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    // Upload the textures and renderbuffers
    // Determine the size of the framebuffer
    let width = gl.drawingBufferWidth;
    let height = gl.drawingBufferHeight;
    // TODO Color only supports texture attachment
    // Also, no stencil for now, and no draw_buffers extension.
    if (this.options.color && typeof this.options.color !== 'number') {
      if (!this.options.color.loaded) {
        this.renderer.textures.use(0, this.options.color);
      }
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, this.options.color.texture, 0);
      width = this.options.color.width;
      height = this.options.color.height;
    } else {
      // ???
      throw new Error('Color attachment must be specified');
    }
    // Bind depth... should support textures too.
    if (this.options.depth && typeof this.options.depth === 'number') {
      // Create renderbuffer if it doesn't exists.
      if (this.depth == null) {
        this.depth = gl.createRenderbuffer();
      }
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
      // TODO Should reset renderbuffer if it has different size.
      gl.renderbufferStorage(gl.RENDERBUFFER, this.options.depth,
        width, height);
      // Bind the renderbuffer.
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
        getAttachment(gl, this.options.depth), gl.RENDERBUFFER, this.depth);
    }
    // Good enough! we're done. Kind of.
  }
  use() {
    if (this.framebuffer == null) return this.init();
    const gl = this.renderer.gl;
    // Too easy
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }
  dispose() {
    const gl = this.renderer.gl;
    if (this.framebuffer == null) return;
    gl.deleteFramebuffer(this.framebuffer);
  }
}
