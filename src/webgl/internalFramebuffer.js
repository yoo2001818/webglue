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
    this.colorUpdate = false;
    this.depth = null;
    this.depthUpdate = false;
    this.width = null;
    this.height = null;
  }
  upload(context, framebuffer) {
    const gl = context.gl;
    this.name = framebuffer.name;
    this.framebuffer = gl.createFramebuffer();
  }
  getAttachment(context, target) {
    const gl = context.gl;
    if (target.format === 'depth') return gl.DEPTH_ATTACHMENT;
    if (target.format === 'stencil') return gl.STENCIL_ATTACHMENT;
    if (target.format === 'depthStencil') return gl.DEPTH_STENCIL_ATTACHMENT;
    return gl.COLOR_ATTACHMENT0;
  }
  useTarget(context, target, isColor, swap) {
    const gl = context.gl;
    // Since depth and color attachment's size should be same,
    // we can safely assume that framebuffer's size is same as color
    // attachment's size.
    if (target instanceof Renderbuffer) {
      let internalBuffer = context.getRenderbuffer(target);
      if (swap) {
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER,
          this.getAttachment(context, target), gl.RENDERBUFFER,
          internalBuffer.buffer);
      }
      if (isColor) {
        this.width = internalBuffer.width;
        this.height = internalBuffer.height;
        this.colorUpdate = internalBuffer.update;
      } else {
        this.depthUpdate = internalBuffer.update;
      }
    } else if (target instanceof Texture) {
      let internalTexture = context.getTexture(target);
      if (swap) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
          this.getAttachment(context, target), gl.TEXTURE_2D,
          internalTexture.texture, 0);
      }
      if (isColor) {
        this.width = internalTexture.width;
        this.height = internalTexture.height;
        this.colorUpdate = internalTexture.update;
      } else {
        this.depthUpdate = internalTexture.update;
      }
    } else if (target != null) {
      let internalTexture = context.getTexture(target.texture);
      let texTarget = TEXTURE_TARGETS[target.target];
      if (swap) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
          this.getAttachment(context, target.texture), texTarget,
          internalTexture.texture, 0);
      }
      if (isColor) {
        this.width = internalTexture.width;
        this.height = internalTexture.height;
        this.colorUpdate = internalTexture.update;
      } else {
        this.depthUpdate = internalTexture.update;
      }
    }
  }
  use(context, framebuffer) {
    const gl = context.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    // Attach framebuffer data, if available.
    // TODO we have to handle WEBGL_draw_buffers extension too
    let swapColor = this.color !== framebuffer.color;
    if (swapColor || this.colorUpdate) {
      this.useTarget(context, framebuffer.color, true, swapColor);
      this.color = framebuffer.color;
    }
    let swapDepth = this.depth !== framebuffer.depth;
    if (swapDepth || this.depthUpdate) {
      this.useTarget(context, framebuffer.depth, false, swapDepth);
      this.depth = framebuffer.depth;
    }
  }
  dispose(context) {
    const gl = context.gl;
    gl.deleteFramebuffer(this.framebuffer);
  }
}
