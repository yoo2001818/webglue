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

function isPromise(promise) {
  if (promise == null) return false;
  return typeof promise.then === 'function';
}

function setUpPromise(texture, source, position) {
  source.then(value => {
    if (position != null) texture.options.source[position] = value;
    else texture.options.source = value;
  });
}

export function isLoaded(source) {
  if (isPromise(source)) return false;
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

function getWidth(options, renderer) {
  return renderer.gl.drawingBufferWidth;
}

function getHeight(options, renderer) {
  return renderer.gl.drawingBufferHeight;
}

export default class Texture {
  constructor(renderer, options) {
    this.renderer = renderer;
    this.options = options;

    // TODO immutable
    if (Array.isArray(this.options.source)) {
      this.options.source = this.options.source.map((source, index) => {
        if (typeof source === 'string') {
          let image = new Image();
          image.src = source;
          return image;
        } else if (isPromise(source)) {
          setUpPromise(this, source, index);
        }
        return source;
      });
    } else {
      if (typeof this.options.source === 'string') {
        let image = new Image();
        image.src = this.options.source;
        this.options.source = image;
      } else if (isPromise(this.options.source)) {
        setUpPromise(this, this.options.source);
      }
    }

    this.unit = -1;
    this.texture = null;
    this.loaded = false;
    // Use this to reupload only the texture
    this.valid = false;

    this.mipmapPending = false;
    this.varyingSize = false;

    this.width = null;
    this.height = null;
  }
  init() {
    const gl = this.renderer.gl;
    this.texture = gl.createTexture();
  }
  uploadTexture(target, source) {
    const gl = this.renderer.gl;
    this.varyingSize = false;
    let format = this.options.format;
    if (typeof format === 'function') {
      format = format(this.options, this.renderer);
    }
    let type = this.options.type;
    if (typeof type === 'function') type = type(this.options, this.renderer);
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
      let width = this.options.width || getWidth;
      let height = this.options.height || getHeight;
      if (typeof width === 'function') {
        width = width(this.options, this.renderer);
        this.varyingSize = true;
      }
      if (typeof height === 'function') {
        height = height(this.options, this.renderer);
        this.varyingSize = true;
      }
      gl.texImage2D(target, 0, format, width, height, 0, format, type, source);

      this.width = width;
      this.height = height;
    }
  }
  validateSize() {
    let width = this.options.width || getWidth;
    let height = this.options.height || getHeight;
    if (typeof width === 'function') {
      width = width(this.options, this.renderer);
    }
    if (typeof height === 'function') {
      height = height(this.options, this.renderer);
    }
    return this.width === width && this.height === height;
  }
  reupload() {
    const gl = this.renderer.gl;
    let source = this.options.source;
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
    this.valid = true;
    return true;
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

    if (!this.reupload()) return false;

    // Set texture parameters
    for (let key in this.options.params) {
      let value = this.options.params[key];
      if (typeof value === 'function') {
        value = value(this.options, this.renderer);
      }
      if (key === 'flipY') continue;
      if (key === 'mipmap') {
        if (source == null) continue;
        if (value) gl.generateMipmap(target);
        continue;
      }
      if (key === 'maxAnisotropy') {
        if (this.renderer.anisotropic) {
          gl.texParameterf(target, OPTIONS_KEY[key], value);
        }
        continue;
      }
      gl.texParameteri(target, OPTIONS_KEY[key], value);
    }
    this.loaded = true;
    this.valid = true;
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
    if (!this.loaded || (this.varyingSize && !this.validateSize())) {
      this.upload();
    } else {
      gl.bindTexture(this.target, this.texture);
      if (!this.valid) this.reupload();
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
