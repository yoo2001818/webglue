const OPTIONS_KEY = {
  magFilter: 0x2800,
  minFilter: 0x2801,
  wrapS: 0x2802,
  wrapT: 0x2803,
  maxAnisotropy: 0x84FE
};

export default class Texture {
  constructor(renderer, options) {
    this.renderer = renderer;
    this.options = options;

    // TODO immutable
    if (typeof this.options.source === 'string') {
      let image = new Image();
      image.src = this.options.source;
      this.options.source = image;
    }

    this.unit = -1;
    this.texture = null;
    this.loaded = false;
  }
  init() {
    const gl = this.renderer.gl;
    this.texture = gl.createTexture();
  }
  upload() {
    const gl = this.renderer.gl;
    if (this.texture == null) this.init();
    let target = this.options.target;
    let format = this.options.format;
    let type = this.options.type;

    // let width = this.options.width || this.options.source.width;
    // let height = this.options.height || this.options.source.height;
    gl.bindTexture(target, this.texture);
    if (this.options.source instanceof Image) {
      let source = this.options.source;
      // Check readystate...
      if (source.readyState != null && source.readyState !== 4) {
        return false;
      }
      // If there is complete property and it is false, return false.
      if (source.complete === false) return false;
    }
    // TODO Cube texture
    gl.texImage2D(target, 0, format, format, type, this.options.source);

    // Set texture parameters
    for (let key in this.options.params) {
      if (key === 'mipmap') {
        if (this.options.params[key]) gl.generateMipmap(target);
        continue;
      }
      if (key === 'maxAnisotropy') {
        gl.texParameterf(target, OPTIONS_KEY[key], this.options.params[key]);
        continue;
      }
      gl.texParameteri(target, OPTIONS_KEY[key], this.options.params[key]);
    }
    this.loaded = true;
    // All done!
  }
  use(unit) {
    const gl = this.renderer.gl;
    this.unit = unit;
    gl.activeTexture(gl.TEXTURE0 + unit);
    // Reupload the texture if required.
    if (this.texture == null) this.init();
    if (!this.loaded) {
      this.upload();
    } else {
      // Just rebind it.
      gl.bindTexture(this.options.target, this.texture);
    }
  }
  dispose() {
    const gl = this.renderer.gl;
    gl.deleteTexture(this.texture);
  }
}
