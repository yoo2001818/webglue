import Texture from './texture';

export default class TextureManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.textures = [];

    // Active textures in LRU order
    this.activeTextures = [];

    const gl = renderer.gl;
    this.defaults = {
      target: renderer.gl.TEXTURE_2D,
      format: renderer.gl.RGB,
      type: renderer.gl.UNSIGNED_BYTE,
      params: {
        magFilter: gl.LINEAR,
        minFilter: gl.LINEAR_MIPMAP_LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        mipmap: true,
        flipY: true
      }
    };
  }
  setDefault(options) {
    this.defaults = options;
  }
  create(options) {
    let combinedOptions = Object.assign({}, this.defaults, options, {
      params: Object.assign({}, this.defaults.params, options.params)
    });
    let texture = new Texture(this.renderer, combinedOptions);
    this.textures.push(texture);
    return texture;
  }
  use(unit, texture) {
    if (unit == null || texture === false) return 0;
    // TODO This swaps texture unit even if that's unnecessary - However
    // anything but draw calls aren't expensive. So we'd just stick with it?
    // If the texture is already bound at right unit, don't do anything
    if (this.activeTextures[unit] === texture && texture.loaded) return;
    // Otherwise, bind the texture at specified unit.
    texture.use(unit);
    this.activeTextures[unit] = texture;
    return texture.unit;
  }
  reset() {
    // Unload all pre-loaded textures
    this.activeTextures = [];
    this.textures.forEach(texture => texture.dispose());
  }
}
