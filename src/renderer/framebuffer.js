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
  init(input) {
    const gl = this.renderer.gl;
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    let options = input || this.options;
    // Upload the textures and renderbuffers
    // Determine the size of the framebuffer
    let width = gl.drawingBufferWidth;
    let height = gl.drawingBufferHeight;
    // TODO Color only supports texture attachment
    // Also, no stencil for now, and no draw_buffers extension.
    if (options.color && typeof options.color !== 'number') {
      let texture = options.color;
      let target = gl.TEXTURE_2D;
      if (options.color.renderer == null) {
        texture = options.color.texture;
        target = options.color.target;
      }
      if (!texture.loaded || (texture.varyingSize && !texture.validateSize())) {
        this.renderer.textures.use(0, texture, true);
      }
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        target, texture.texture, 0);
      width = texture.width;
      height = texture.height;
      this.color = texture;
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
    this.width = width;
    this.height = height;
  }
  rebind(options) {
    const gl = this.renderer.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    if (options.color && typeof options.color !== 'number') {
      this.options.color = options.color;
      let texture = options.color;
      let target = gl.TEXTURE_2D;
      if (options.color.renderer == null) {
        texture = options.color.texture;
        target = options.color.target;
      }
      if (!texture.loaded || (texture.varyingSize && !texture.validateSize())) {
        this.renderer.textures.use(0, texture, true);
      }
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        target, texture.texture, 0);
      this.width = texture.width;
      this.height = texture.height;
      this.color = texture;
    }
  }
  resize() {
    const gl = this.renderer.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    let options = this.options;
    // Upload the textures and renderbuffers
    // Determine the size of the framebuffer
    let width = gl.drawingBufferWidth;
    let height = gl.drawingBufferHeight;
    // TODO Color only supports texture attachment
    // Also, no stencil for now, and no draw_buffers extension.
    if (options.color && typeof options.color !== 'number') {
      let texture = options.color;
      let target = gl.TEXTURE_2D;
      if (options.color.renderer == null) {
        texture = options.color.texture;
        target = options.color.target;
      }
      if (!texture.loaded || (texture.varyingSize && !texture.validateSize())) {
        this.renderer.textures.use(0, texture, true);
      }
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        target, texture.texture, 0);
      width = texture.width;
      height = texture.height;
      this.color = texture;
    } else {
      // ???
      throw new Error('Color attachment must be specified');
    }
    // Bind depth... should support textures too.
    if (options.depth && typeof options.depth === 'number') {
      if (this.width !== width || this.height !== height) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
        // TODO Should reset renderbuffer if it has different size.
        gl.renderbufferStorage(gl.RENDERBUFFER, options.depth,
          width, height);
        // Bind the renderbuffer.
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
          getAttachment(gl, options.depth), gl.RENDERBUFFER, this.depth);
      }
    }
    // Good enough! we're done. Kind of.
    this.width = width;
    this.height = height;
  }
  validateSize() {
    if (this.color != null && this.color.varyingSize &&
      !this.color.validateSize()
    ) {
      return false;
    }
    return this.color.width === this.width && this.color.height === this.height;
  }
  readPixels(x, y, width, height, format, type, pixels) {
    const gl = this.renderer.gl;
    // Use itself
    this.renderer.framebuffers.use(this);
    return gl.readPixels(x, y, width, height, format, type, pixels);
  }
  readPixelsRGBA(x, y, width, height, pixels) {
    const gl = this.renderer.gl;
    if (pixels instanceof Uint8Array) {
      return this.readPixels(x, y, width, height, gl.RGBA,
        gl.UNSIGNED_BYTE, pixels);
    } else if (pixels instanceof Float32Array) {
      return this.readPixels(x, y, width, height, gl.RGBA,
        gl.FLOAT, pixels);
    } else {
      throw new Error('Uint16Array is not supported (use readPixels)');
    }
  }
  readPixelsRGB(x, y, width, height, pixels) {
    const gl = this.renderer.gl;
    if (pixels instanceof Uint8Array) {
      return this.readPixels(x, y, width, height, gl.RGB,
        gl.UNSIGNED_BYTE, pixels);
    } else if (pixels instanceof Float32Array) {
      return this.readPixels(x, y, width, height, gl.RGB,
        gl.FLOAT, pixels);
    } else {
      throw new Error('Uint16Array is not supported (use readPixels)');
    }
  }
  use(options) {
    if (this.framebuffer == null) return this.init(options);
    if (options != null) return this.rebind(options);
    if (!this.validateSize()) {
      return this.resize();
    }
    const gl = this.renderer.gl;
    // Too easy
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }
  dispose() {
    const gl = this.renderer.gl;
    if (this.framebuffer == null) return;
    gl.deleteFramebuffer(this.framebuffer);
    this.framebuffer = null;
  }
}
