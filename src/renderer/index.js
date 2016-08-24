import ShaderManager from './shaderManager';
import GeometryManager from './geometryManager';
import TextureManager from './textureManager';
import StateManager from './stateManager';

export default class Renderer {
  constructor(gl) {
    this.gl = gl;

    this.shaders = new ShaderManager(this);
    this.geometries = new GeometryManager(this);
    this.textures = new TextureManager(this);
    this.state = new StateManager(this);
    // This should be preconfigured in order to set 'standard' attribute
    // indices.
    // Geometries using non-standard attributes cannot be properly cached
    // using VAO.
    // WebGLue geometries use this attributes, however, users can change this
    // to other one.
    // TODO Bind multiple attributes to single index??
    this.attributes = ['aPosition', 'aNormal', 'aTangent', 'aTexCoord'];
  }
  render(data) {
    // Render each pass
    data.forEach(pass => this.renderPass(pass));
  }
  renderPass(pass, parent) {
    let currentLevel = {
      uniforms: Object.assign({}, parent && parent.uniforms, pass.uniforms),
      options: Object.assign({}, parent && parent.options, pass.options),
      shader: pass.shader || (parent && parent.shader),
      geometry: pass.geometry || (parent && parent.geometry)
    };
    // -- Push (Enter)
    // Set state
    if (pass.options) {
      this.state.set(pass.options, parent == null);
    }
    // TODO Set output
    if (pass.shader) {
      this.shaders.use(pass.shader);
      // Reset all uniforms, including parent uniforms
      this.shaders.setUniforms(currentLevel.uniforms);
    } else if (pass.uniforms) {
      // Set uniforms normally
      this.shaders.setUniforms(pass.uniforms);
    }
    if (pass.geometry) {
      this.geometries.use(pass.geometry);
    }
    // -- Draw call... quite simple.
    if (pass.draw) {
      this.geometries.draw();
    }
    // -- Children
    if (pass.passes) {
      pass.passes.forEach(data => this.renderPass(data, currentLevel));
    }
    // -- Pop (Exit)
    if (parent == null) return;
    // Restore uniforms and shader
    if (parent.shader && pass.shader) {
      this.shaders.use(parent.shader);
      // Reset all uniforms, including parent uniforms
      this.shaders.setUniforms(parent.uniforms);
    } else if (parent.uniforms && pass.uniforms) {
      // Restore uniforms...
      /*
      let recoverOpts = {};
      for (let key in pass.uniforms) {
        recoverOpts[key] = parent.uniforms[key] || false;
      }
      this.shaders.setUniforms(recoverOpts);
      */
    }
    // Restore geometry
    if (parent.geometry && pass.geometry) {
      this.geometries.use(parent.geometry);
    }
    // Restore options
    if (parent.options && pass.options) {
      let recoverOpts = {};
      for (let key in pass.options) {
        if (key === 'clearStencil') continue;
        if (key === 'clearDepth') continue;
        if (key === 'clearColor') continue;
        // Disable if not found
        recoverOpts[key] = parent.options[key] || false;
      }
      this.state.set(recoverOpts);
    }
  }
}
