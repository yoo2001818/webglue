import Shader from './shader';
export default class ShaderManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.shaders = [];
    this.current = null;
  }
  create(vert, frag) {
    // TODO It should support 'define', but not for now.
    let shader = new Shader(this.renderer, vert, frag);
    this.shaders.push(shader);
    return shader;
  }
  use(shader) {
    this.current = shader;
    shader.use();
  }
  setUniforms(values) {
    if (this.current == null) return;
    this.current.setUniforms(values);
  }
}
