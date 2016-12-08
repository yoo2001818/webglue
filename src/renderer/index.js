import ShaderManager from './shaderManager';
import GeometryManager from './geometryManager';
import TextureManager from './textureManager';
import FramebufferManager from './framebufferManager';
import StateManager from './stateManager';
import RenderNode from '../util/renderNode';

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
    this.state.currentNode = null;
    if (!Array.isArray(data)) return this.renderPass(data, null);
    // Render each pass
    data.forEach(pass => this.renderPass(pass, null));
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
  renderPass(pass, parent) {
    if (pass == null || pass === false) return;
    if (Array.isArray(pass)) {
      pass.forEach(data => this.renderPass(data, parent));
      return;
    }
    if (typeof pass === 'function') {
      return this.renderPass(pass(parent), parent);
    }
    // Build node
    let node = new RenderNode(pass, parent);
    // Set framebuffers.
    if (pass.framebuffer != null || parent == null) {
      this.framebuffers.use(pass.framebuffer);
      if (node.getOption('viewport') == null) this.setViewport();
    }
    if (pass.options != null) this.state.clear(pass.options);
    // We do 'lazy evaluation' or something like that - to prevent useless
    // WebGL calls.
    if (pass.passes == null) {
      this.shaders.handler = node.shaderHandler;
      this.textures.handler = node.textureHandler;
      // Check frustum culling
      if (!node.shader.frustumCull ||
        this.shaders.checkFrustum(this, node)
      ) {
        this.state.setNode(node);
        if (this.shaders.useNode(node) !== false) {
          this.geometries.use(node.geometry);
          this.geometries.draw();
        }
      }
      // Check mipmap
      if (node.framebuffer != null && node.getOption('mipmap') === true) {
        // TODO This will be a problem if color texture is not specified
        let texture = this.framebuffers.current.options.color;
        if (texture.renderer == null) texture = texture.texture;
        texture.generateMipmap();
      }
    } else {
      if (Array.isArray(pass.passes)) {
        pass.passes.forEach(data => this.renderPass(data, node));
      } else {
        this.renderPass(pass.passes, node);
      }
    }
    if (pass.framebuffer !== undefined && parent != null) {
      this.framebuffers.use(parent.framebuffer);
      if (parent.getOption('viewport') == null) this.setViewport();
    }
  }
}
