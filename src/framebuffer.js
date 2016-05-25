// Represents single FBO used in off-screen rendering.
export default class Framebuffer {
  constructor(color, depth, name) {
    this.name = name || Symbol('framebuffer_' + (Math.random() * 1000 | 0));
    // Color buffer. Arrays can be used to use WEBGL_draw_buffers extension,
    // however other textures will be ignored if unsupported by hardware.
    // Fallback might be implemented by rendering same scene few times.
    // (It's really bad, I know.)
    // Color buffer can't be null - It'll throw an error if that happens.
    // If the texture is a cube texture, you have to specify the render target
    // by wrapping the texture by an object:
    // { texture: Texture, target: 'left' }
    this.color = color;
    // Depth or stencil can be provided; Since WebGL doesn't support specifying
    // both depth / stencil buffers, (We have to use DEPTH_STENCIL to do that)
    // only one field is enough.
    this.depth = depth;
  }
}
