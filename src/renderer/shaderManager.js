import PreprocessShader from './preprocessShader';
export default class ShaderManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.shaders = [];
    this.current = null;
    this.handler = null;
  }
  create(vert, frag) {
    let shader = new PreprocessShader(this.renderer, vert, frag);
    this.shaders.push(shader);
    return shader;
  }
  use(shader, uniforms) {
    let returned = shader.getShader(uniforms, this.current);
    if (this.handler) {
      returned = this.handler(returned, uniforms, this.renderer);
    }
    this.current = returned.use(uniforms, this.current);
  }
  reset() {
    this.current = null;
    this.shaders.forEach(shader => shader.dispose());
  }
}
