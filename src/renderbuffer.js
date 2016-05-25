export default class Renderbuffer {
  constructor(format, width, height, name) {
    this.name = name || Symbol('renderbuffer_' + (Math.random() * 1000 | 0));
    // Format can be one of:
    // rgba4, rgb565, rgb5a1, depth, stencil, depthStencil
    // (WEBGL_color_buffer_float) rgba32f, rgb32f
    // (EXT_sRGB) srgb8Alpha8
    this.format = format;
    this.width = width;
    this.height = height;
  }
}
