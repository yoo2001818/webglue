import Renderbuffer from '../renderbuffer';
import Texture from '../texture';

const TEXTURE_TARGETS = {
  '2d': 0x0DE1,
  'right': 0x8515,
  'left': 0x8516,
  'up': 0x8517,
  'down': 0x8518,
  'front': 0x8519,
  'back': 0x851A
};

export default class InternalFramebuffer {
  constructor() {
    this.name = null;
    this.framebuffer = null;
    this.color = null;
    this.depth = null;
  }
  upload(context, framebuffer) {
    const gl = context.gl;
    this.name = framebuffer.name;
    this.framebuffer = gl.createFramebuffer();
  }
  use(context, framebuffer) {
    const gl = context.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    // Attach framebuffer data, if available.
    // TODO we have to handle WEBGL_draw_buffers extension too
    if (this.color !== framebuffer.color) {
      if (framebuffer.color instanceof Renderbuffer) {
        let renderbuffer = framebuffer.color;
        let glBuffer = context.getRenderbuffer(renderbuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, glBuffer);
      } else if (framebuffer.color instanceof Texture) {
        // Assume 2D texture is bound
        let texture = framebuffer.color;
        let glBuffer = context.getTexture(texture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glBuffer, 0);
      } else if (framebuffer != null) {
        let texture = framebuffer.color.texture;
        let glBuffer = context.getTexture(texture);
        let target = TEXTURE_TARGETS[framebuffer.color.target];
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0, target, glBuffer, 0);
      }
      this.color = framebuffer.color;
    }
    // Ignore depth target for now.
    // TODO We have to implement it anyway
  }
  dispose(context) {
    const gl = context.gl;
    gl.deleteFramebuffer(this.framebuffer);
  }
}
