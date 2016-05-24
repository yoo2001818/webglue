// Oh god why?
const FORMATS = {
  alpha: 0x1906,
  rgb: 0x1907,
  rgba: 0x1908,
  luminance: 0x1909,
  luminanceAlpha: 0x190A,
  depth: 0x1902,
  depthStencil: 0x84F9,
  srgb: 0x8C40,
  srgbAlpha: 0x8C42
};

const TYPES = {
  uint8: 0x1401,
  uint565: 0x8363,
  uint4444: 0x8033,
  uint5551: 0x8034,
  uint16: 0x1403,
  uint32: 0x1405,
  uint24_8: 0x84FA,
  float: 0x1406,
  halfFloat: 0x8D61
};

const OPTIONS_KEY = {
  magFilter: 0x2800,
  minFilter: 0x2801,
  wrapS: 0x2802,
  wrapT: 0x2803,
  maxAnisotropy: 0x84FE
};

const OPTIONS_VALUE = {
  nearest: 0x2600,
  linear: 0x2601,
  nearestMipmapNearest: 0x2700,
  linearMipmapNearest: 0x2701,
  nearestMipmapLinear: 0x2702,
  linearMipmapLinear: 0x2703,
  repeat: 0x2901,
  clamp: 0x812F,
  mirror: 0x8370
};

export default class InternalTexture {
  constructor() {
    this.texture = null;
    this.name = null;
    this.type = null;
    this.update = false;
    this.lastUsed = 0;
    this.unitId = -1;

    this.width = null;
    this.height = null;
  }
  init(context, texture) {
    const gl = context.gl;
    this.name = texture.name;
    this.target = texture.target === '2d' ? gl.TEXTURE_2D : gl.TEXTURE_CUBE_MAP;
    // Create texture
    this.texture = gl.createTexture();
    // This is true if the texture is fully loaded - otherwise it's false.
    this.loaded = false;
    this.lastUsed = 0;

    // Width and height information for framebuffers.
    this.width = null;
    this.height = null;
  }
  upload(context, texture, unit) {
    const gl = context.gl;
    if (!this.loaded && texture.isLoaded()) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(this.target, this.texture);
      // Perform texture logic - this is really cumbersome.
      let format = FORMATS[texture.format];
      let type = TYPES[texture.type];

      let width = texture.width || context.width;
      let height = texture.height || context.height;
      if (texture.source && texture.source.width != null) {
        width = texture.source.width;
        height = texture.source.height;
      }

      if (texture.target === '2d') {
        if (texture.source == null) {
          // Source is not provided; create empty texture.
          gl.texImage2D(this.target, 0, format, width, height, 0, format, type);
        } else {
          // This assumes that the source is not ArrayBufferView.
          gl.texImage2D(this.target, 0, format, format, type, texture.source);
        }
      } else {
        // Cube map. Basically, we have to do upload 6 times.
        for (let i = 0; i < 6; ++i) {
          if (texture.source == null) {
            // Source is not provided; create empty texture.
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, format,
              width, height, 0, format, type);
          } else {
            // This assumes that the source is not ArrayBufferView.
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, format,
              format, type, texture.source[i]);
          }
        }
      }
      // Now set the textue properties..
      for (let key in texture.options) {
        if (key === 'mipmap') {
          gl.generateMipmap(this.target);
          continue;
        }
        if (key === 'maxAnisotropy') {
          gl.texParameterf(this.target, OPTIONS_KEY[key], texture.options[key]);
          continue;
        }
        gl.texParameteri(this.target, OPTIONS_KEY[key],
          OPTIONS_VALUE[texture.options[key]]);
      }

      this.width = width;
      this.height = height;
      this.loaded = true;
    }
  }
  use(context, texture, unit) {
    const gl = context.gl;
    if (!this.loaded && texture.isLoaded()) {
      this.upload(context, texture, unit);
    } else {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(this.target, this.texture);
    }
  }
  dispose(context) {
    const gl = context.gl;
    gl.deleteTexture(this.texture);
  }
}
