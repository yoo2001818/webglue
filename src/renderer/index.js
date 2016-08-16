import ShaderManager from './shaderManager';
import GeometryManager from './geometryManager';
import StateManager from './stateManager';

export default class Renderer {
  constructor(gl) {
    this.gl = gl;

    this.shaders = new ShaderManager(this);
    this.geometries = new GeometryManager(this);
    this.state = new StateManager(this);
  }
  render(data) {
    // Render each pass
    data.forEach(pass => this.renderPass(pass));
  }
  renderPass(pass, parent = null) {
    // Push (Enter)
    // Set state
    if (pass.options) {
      this.state.set(pass.options, parent == null);
    }
    // TODO Set output
    if (pass.shader) {
      this.shaders.use(pass.shader);
    }
    if (pass.uniforms) {
      this.shaders.setUniforms(pass.uniforms);
    }
    if (pass.geometry) {
      this.geometries.use(pass.geometry);
    }
    if (pass.draw) {
      this.geometries.draw();
    }
    // Children
    if (pass.passes) {
      pass.passes.forEach(data => this.renderPass(data, pass));
    }
    // Pop (Exit)
    if (parent != null) {
      // if (pass.options) this.state.set(parent.options)
    }
  }
}
