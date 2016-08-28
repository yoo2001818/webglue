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
  use(framebuffer) {
    if (framebuffer == null || framebuffer === false) {
      if (this.current == null) return;
      const gl = this.renderer.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this.current = null;
      return;
    }
    if (this.current === framebuffer) return;
    framebuffer.use();
    this.current = framebuffer;
  }
  reset() {
    this.current = null;
    this.framebuffers.forEach(framebuffer => framebuffer.dispose());
  }
}
