const OPTIONS_KEY = {
  magFilter: 0x2800,
  minFilter: 0x2801,
  wrapS: 0x2802,
  wrapT: 0x2803,
  maxAnisotropy: 0x84FE
};

export function isSource(source) {
  if (source instanceof HTMLElement) return true;
  if (source instanceof ImageData) return true;
  return false;
}

export function isLoaded(source) {
  if (isSource(source)) {
    // Check readystate...
    if (source.readyState != null && source.readyState !== 4) {
      return false;
    }
    // If there is complete property and it is false, return false.
    if (source.complete === false) return false;
  }
  return true;
}

export default class Texture {
  constructor(renderer, options) {
    this.renderer = renderer;
    this.options = options;

    // TODO immutable
    if (Array.isArray(this.options.source)) {
      this.options.source = this.options.source.map(source => {
        if (typeof source === 'string') {
          let image = new Image();
          image.src = source;
          return image;
        }
        return source;
      });
    } else {
      if (typeof this.options.source === 'string') {
        let image = new Image();
        image.src = this.options.source;
        this.options.source = image;
      }
    }

    this.unit = -1;
    this.texture = null;
    this.loaded = false;

    this.mipmapPending = false;

    this.width = null;
    this.height = null;
  }
  init() {
    const gl = this.renderer.gl;
    this.texture = gl.createTexture();
  }
  uploadTexture(target, source) {
    const gl = this.renderer.gl;
    let format = this.options.format;
    let type = this.options.type;
    if (isSource(source)) {
      gl.texImage2D(target, 0, format, format, type, source);

      if (this.width !== null && source.width !== this.width &&
        this.height !== null && source.height !== this.height
      ) {
        throw new Error('Size mismatch');
      }
      this.width = source.width;
      this.height = source.height;
    } else {
      // width and height shouldn't be 0, right?
      let width = this.options.width || gl.drawingBufferWidth;
      let height = this.options.height || gl.drawingBufferHeight;
      gl.texImage2D(target, 0, format, width, height, 0, format, type, source);

      this.width = width;
      this.height = height;
    }
  }
  upload() {
    const gl = this.renderer.gl;
    if (this.texture == null) this.init();
    let target;
    let source = this.options.source;
    if (Array.isArray(source)) {
      target = gl.TEXTURE_CUBE_MAP;
    } else {
      target = gl.TEXTURE_2D;
    }
    this.target = target;
    gl.bindTexture(target, this.texture);

    this.width = null;
    this.height = null;

    // Make sure everything is loaded and load...
    if (Array.isArray(source)) {
      if (!source.every(isLoaded)) return false;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.options.params.flipY);
      for (let i = 0; i < 6; ++i) {
        this.uploadTexture(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, source[i]);
      }
    } else {
      if (!isLoaded(source)) return false;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.options.params.flipY);
      this.uploadTexture(gl.TEXTURE_2D, source);
    }

    // Set texture parameters
    for (let key in this.options.params) {
      if (key === 'flipY') continue;
      if (key === 'mipmap') {
        if (source == null) continue;
        if (this.options.params[key]) gl.generateMipmap(target);
        continue;
      }
      if (key === 'maxAnisotropy') {
        if (this.renderer.anisotropic) {
          gl.texParameterf(target, OPTIONS_KEY[key], this.options.params[key]);
        }
        continue;
      }
      gl.texParameteri(target, OPTIONS_KEY[key], this.options.params[key]);
    }
    this.loaded = true;
    // All done!
  }
  generateMipmap() {
    this.mipmapPending = true;
  }
  use(unit, isFramebuffer) {
    const gl = this.renderer.gl;
    this.unit = unit;
    gl.activeTexture(gl.TEXTURE0 + unit);
    // Reupload the texture if required.
    if (this.texture == null) this.init();
    if (!this.loaded) {
      this.upload();
    } else {
      gl.bindTexture(this.target, this.texture);
      if (this.mipmapPending && !isFramebuffer) {
        this.mipmapPending = false;
        gl.generateMipmap(this.target);
      }
    }
  }
  dispose() {
    const gl = this.renderer.gl;
    gl.deleteTexture(this.texture);
    this.texture = null;
    this.loaded = false;
  }
}
