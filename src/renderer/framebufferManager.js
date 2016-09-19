import Framebuffer from './framebuffer';

export default class FramebufferManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.framebuffers = [];
    this.current = null;
  }
  create(options) {
    let framebuffer = new Framebuffer(this.renderer, options);
    this.framebuffers.push(framebuffer);
    return framebuffer;
  }
  use(input) {
    let framebuffer = input;
    let options;
    if (framebuffer == null || framebuffer === false) {
      if (this.current == null) return;
      const gl = this.renderer.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this.current = null;
      return;
    }
    if (input.renderer == null) {
      options = input;
      framebuffer = input.framebuffer;
    }
    if (this.current === framebuffer) return;
    framebuffer.use(options);
    this.current = framebuffer;
  }
  reset() {
    this.current = null;
    this.framebuffers.forEach(framebuffer => framebuffer.dispose());
  }
}
