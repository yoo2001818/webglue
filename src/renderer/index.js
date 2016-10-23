import ShaderManager from './shaderManager';
import GeometryManager from './geometryManager';
import TextureManager from './textureManager';
import FramebufferManager from './framebufferManager';
import StateManager from './stateManager';

export default class Renderer {
  constructor(gl) {
    this.gl = gl;

    this.shaders = new ShaderManager(this);
    this.geometries = new GeometryManager(this);
    this.textures = new TextureManager(this);
    this.framebuffers = new FramebufferManager(this);
    this.state = new StateManager(this);
    // This should be preconfigured in order to set 'standard' attribute
    // indices.
    // Geometries using non-standard attributes cannot be properly cached
    // using VAO.
    // WebGLue geometries use this attributes, however, users can change this
    // to other one.
    // TODO Bind multiple attributes to single index??
    this.attributes = ['aPosition', 'aNormal', 'aTexCoord', 'aTangent'];
    this.width = null;
    this.height = null;
    this.reset();
  }
  reset() {
    // Should be called after WebGL context reset.
    this.shaders.reset();
    this.geometries.reset();
    this.textures.reset();
    this.framebuffers.reset();
    this.state.reset();
    // Use WebGL extension, if possible.
    this.vao = this.gl.getExtension('OES_vertex_array_object');
    this.uint = this.gl.getExtension('OES_element_index_uint');
    this.instanced = this.gl.getExtension('ANGLE_instanced_arrays');
    this.derivatives = this.gl.getExtension('OES_standard_derivatives');
    this.anisotropic = this.gl.getExtension('EXT_texture_filter_anisotropic');

    this.width = this.gl.drawingBufferWidth;
    this.height = this.gl.drawingBufferHeight;
  }
  render(data) {
    if (this.gl.isContextLost()) return false;
    if (this.framebuffers.current == null) {
      const gl = this.gl;
      // Set the viewport size
      this.width = gl.drawingBufferWidth;
      this.height = gl.drawingBufferHeight;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    } else {
      this.framebuffers.use(this.framebuffers.current);
    }
    if (!Array.isArray(data)) return this.renderPass(data, {});
    // Render each pass
    data.forEach(pass => this.renderPass(pass, {}));
  }
  setViewport() {
    const gl = this.gl;
    // TODO Check options and if viewport doesn't exist, continue to use
    // framebuffer's size.
    if (this.framebuffers.current == null) {
      this.width = gl.drawingBufferWidth;
      this.height = gl.drawingBufferHeight;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    } else {
      let framebuffer = this.framebuffers.current;
      this.width = framebuffer.width;
      this.height = framebuffer.height;
      gl.viewport(0, 0, framebuffer.width, framebuffer.height);
    }
  }
  renderPass(pass, tree) {
    if (pass == null) return;
    if (Array.isArray(pass)) {
      pass.forEach(data => this.renderPass(data, tree));
      return;
    }
    if (typeof pass === 'function') {
      return this.renderPass(pass(tree), tree);
    }
    if (tree.uniforms == null) tree.uniforms = {};
    if (tree.options == null) tree.options = {};
    let parent = {};
    if (pass.uniforms) {
      parent.uniforms = {};
      for (let key in pass.uniforms) {
        parent.uniforms[key] = tree.uniforms[key];
        tree.uniforms[key] = pass.uniforms[key];
      }
    }
    if (pass.options) {
      parent.options = {};
      for (let key in pass.options) {
        parent.options[key] = tree.options[key];
        tree.options[key] = pass.options[key];
      }
    }
    if (pass.shaderHandler) {
      parent.shaderHandler = tree.shaderHandler;
      tree.shaderHandler = pass.shaderHandler;
      this.shaders.handler = pass.shaderHandler;
    }
    if (pass.textureHandler) {
      parent.textureHandler = tree.textureHandler;
      tree.textureHandler = pass.textureHandler;
      this.textures.handler = pass.textureHandler;
    }
    if (pass.shader) {
      parent.shader = tree.shader;
      tree.shader = pass.shader;
    }
    if (pass.geometry) {
      parent.geometry = tree.geometry;
      tree.geometry = pass.geometry;
    }
    if (pass.framebuffer) {
      parent.framebuffer = tree.framebuffer;
      tree.framebuffer = pass.framebuffer;
    }
    // -- Push (Enter)
    // Set state
    if (tree.framebuffer != this.framebuffers.current) {
      this.framebuffers.use(pass.framebuffer);
      if (tree.options.viewport == null) this.setViewport();
    }
    if (pass.options) {
      this.state.set(pass.options, parent == null);
    }
    // -- Draw call... quite simple.
    if (pass.passes == null) {
      this.shaders.use(tree.shader, tree.uniforms);
      this.geometries.use(tree.geometry);
      this.geometries.draw();
      // Check mipmap
      if (tree.framebuffer != null && tree.options.mipmap === true) {
        // TODO This will be a problem if color texture is not specified
        let texture = this.framebuffers.current.options.color;
        if (texture.renderer == null) texture = texture.texture;
        texture.generateMipmap();
      }
    }
    // -- Children
    if (pass.passes) {
      if (Array.isArray(pass.passes)) {
        pass.passes.forEach(data => this.renderPass(data, tree));
      } else {
        this.renderPass(pass.passes, tree);
      }
    }
    // -- Pop (Exit)
    // Restore uniforms and shader
    if (pass.shaderHandler) {
      tree.shaderHandler = parent.shaderHandler;
      this.shaders.handler = parent.shaderHandler;
    }
    if (pass.textureHandler) {
      tree.textureHandler = parent.textureHandler;
      this.textures.handler = parent.textureHandler;
    }
    if (parent.shader && pass.shader) {
      tree.shader = parent.shader;
    }
    if (parent.uniforms && pass.uniforms) {
      Object.assign(tree.uniforms, parent.uniforms);
    }
    if (parent.geometry && pass.geometry) {
      tree.geometry = parent.geometry;
    }
    // Restore options
    if (parent.options && pass.options) {
      Object.assign(tree.options, parent.options);
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
    // Restore framebuffer
    if (pass.framebuffer) {
      tree.framebuffer = parent.framebuffer;
      this.framebuffers.use(parent.framebuffer);
      if (tree.options.viewport == null) this.setViewport();
    }
  }
}
