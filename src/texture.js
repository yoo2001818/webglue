export default class Texture {
  constructor(source, format, type, options = {}, name) {
    this.name = name || Symbol('texture_' + (Math.random() * 1000 | 0));
    // Can be one of 2d or cube.
    this.target = '2d';
    // Can be one of:
    // alpha, rgb, rgba, luminance, luminanceAlpha
    // (WEBGL_depth_texture) depth, depthStencil,
    // (EXT_sRGB) srgb, srgbAlpha
    this.format = format;
    // Can be one of:
    // all: uint8, float, halfFloat
    // rgb: uint565
    // rgba: uint4444, uint5551
    // depth: uint16, uint32, uint24_8
    // float and halfFloat requires OES_texture_float and OES_texture_half_float
    this.type = type;
    // magFilter: linear, nearest
    // minFilter: linear, nearest, nearestMipmapNearest, linearMipmapNearest,
    //            nearestMipmapLinear, linearMipmapLinear
    // wrapS: repeat, clamp, mirror
    // wrapT: repeat, clamp, mirror
    // maxAnisotropy: Number value.
    // mipmap: Boolean value.
    this.options = options;
    // The size to use. If null, screen size will be used instead.
    // If image is provided, it'll be ignored and image's size will be used
    // instead.
    this.width = null;
    this.height = null;
    // The image source. Cube textures accept an array of image sources.
    // If null, blank texture will be created (to pass to framebuffer)
    this.source = source;
    // If true, it'll upload the source image to GPU every frame.
    // However it shouldn't be changed after providing it to the GPU.
    this.update = false;
  }
  // TODO this might have to be moved to internalTexture logic
  isLoaded() {
    // If source is not available, just return true.
    if (this.source == null) return true;
    // Check readystate...
    if (this.source.readyState != null && this.source.readyState !== 4) {
      return false;
    }
    // If there is complete property and it is false, return false.
    if (this.source.complete === false) return false;
    // If this is an array, check complete property for every sub-source.
    if (Array.isArray(this.source)) {
      return this.source.every(image => image.complete);
    }
    // Otherwise, it'd be true.
    return true;
  }
}
