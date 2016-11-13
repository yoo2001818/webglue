// Represents each 'render pass' node. Used to memorize uniforms data, and
// avoid setting same uniforms / options twice.
export default class RenderNode {
  constructor(data, parent) {
    this.depth = 0;
    if (parent != null) this.depth = parent.depth + 1;
    this.parent = parent;

    if (this.depth === 0) this.root = this;
    else if (this.depth === 1) this.root = parent;
    else this.root = parent.root;

    this.data = data;
    this.framebuffer = data.framebuffer === undefined ?
      (parent && parent.framebuffer) : data.framebuffer;
    this.shader = data.shader || (parent && parent.shader);
    this.geometry = data.geometry || (parent && parent.geometry);
    this.shaderHandler = data.shaderHandler || (parent && parent.shaderHandler);
    this.textureHandler = data.textureHandler ||
      (parent && parent.textureHandler);
  }
  get(key) {
    if (this.data[key] !== undefined) return this.data[key];
    if (this.parent != null) return this.parent.get(key);
    return null;
  }
  getOption(key) {
    let options = this.data.options;
    if (options != null && options[key] !== undefined) return options[key];
    if (this.parent != null) return this.parent.getOption(key);
    return null;
  }
  getUniform(key) {
    let uniforms = this.data.uniforms;
    if (uniforms != null && uniforms[key] !== undefined) return uniforms[key];
    if (this.parent != null) return this.parent.getUniform(key);
    return null;
  }
}
