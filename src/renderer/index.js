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
    let newTree = {
      uniforms: {},
      options: {}
    };
    if (!Array.isArray(data)) return this.renderPass(data, newTree, true);
    // Render each pass
    data.forEach(pass => this.renderPass(pass, newTree, true));
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
  renderPass(pass, tree, isRoot) {
    if (pass == null || pass === false) return;
    if (Array.isArray(pass)) {
      pass.forEach(data => this.renderPass(data, tree));
      return;
    }
    if (typeof pass === 'function') {
      return this.renderPass(pass(tree), tree);
    }
    let newTree = Object.assign({}, tree);
    if (pass.framebuffer != null) newTree.framebuffer = pass.framebuffer;
    if (pass.framebuffer || isRoot) {
      this.framebuffers.use(pass.framebuffer);
      if (newTree.options.viewport == null) this.setViewport();
    }
    if (pass.uniforms) {
      newTree.uniforms = Object.assign({}, tree.uniforms, pass.uniforms);
    }
    let optionsRecover;
    if (pass.options) {
      optionsRecover = {};
      newTree.options = Object.assign({}, tree.options);
      for (let key in pass.options) {
        if (key === 'clearStencil' || key === 'clearDepth' ||
          key === 'clearColor') continue;
        optionsRecover[key] = newTree.options[key] || false;
        newTree.options[key] = pass.options[key];
      }
      this.state.set(pass.options, isRoot);
    }
    if (pass.shaderHandler) newTree.shaderHandler = pass.shaderHandler;
    if (pass.textureHandler) newTree.textureHandler = pass.textureHandler;
    this.shaders.handler = newTree.shaderHandler;
    this.textures.handler = newTree.textureHandler;
    if (pass.shader) newTree.shader = pass.shader;
    if (pass.geometry) newTree.geometry = pass.geometry;
    // -- Push (Enter)
    // -- Draw call... quite simple.
    if (pass.passes == null) {
      this.shaders.use(newTree.shader, newTree.uniforms);
      this.geometries.use(newTree.geometry);
      this.geometries.draw();
      // Check mipmap
      if (newTree.framebuffer != null && newTree.options.mipmap === true) {
        // TODO This will be a problem if color texture is not specified
        let texture = this.framebuffers.current.options.color;
        if (texture.renderer == null) texture = texture.texture;
        texture.generateMipmap();
      }
    }
    // -- Children
    if (pass.passes) {
      if (Array.isArray(pass.passes)) {
        pass.passes.forEach(data => this.renderPass(data, newTree));
      } else {
        this.renderPass(pass.passes, newTree);
      }
    }
    // -- Pop (Exit)
    // Restore options
    if (pass.options && !isRoot) {
      this.state.set(optionsRecover);
    }
    if (pass.framebuffer) {
      this.framebuffers.use(tree.framebuffer);
      if (newTree.options.viewport == null) this.setViewport();
    }
  }
}
