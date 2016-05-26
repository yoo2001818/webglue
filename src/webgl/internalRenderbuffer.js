const FORMATS = {
  rgba4: 0x8056,
  rgb565: 0x8D62,
  rgb5a1: 0x8057,
  depth: 0x81A5,
  stencil: 0x8D48,
  depthStencil: 0x84F9,
  rgba32f: 0x8814,
  rgb32f: 0x8815,
  srgb8Alpha8: 0x8C43
};

export default class InternalRenderbuffer {
  constructor() {
    this.buffer = null;
    this.name = null;

    this.loaded = false;
    this.update = false;

    this.width = null;
    this.height = null;
  }
  reupload(context, renderbuffer) {
    const gl = context.gl;

    let width = renderbuffer.width || context.width;
    let height = renderbuffer.height || context.height;

    gl.bindRenderbuffer(gl.RENDERBUFFER, this.buffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, FORMATS[renderbuffer.format],
      width, height);

    this.width = width;
    this.height = height;
  }
  upload(context, renderbuffer) {
    const gl = context.gl;
    this.name = renderbuffer.name;
    // Create render buffer
    this.buffer = gl.createRenderbuffer();
    this.loaded = true;
    // Decides whether if it should update every frame or not.
    this.update = renderbuffer.width == null || renderbuffer.height == null;

    // Width and height information for framebuffers.
    this.width = null;
    this.height = null;

    this.reupload(context, renderbuffer);
  }
  dispose(context) {
    const gl = context.gl;
    gl.deleteRenderbuffer(this.buffer);
  }
}
