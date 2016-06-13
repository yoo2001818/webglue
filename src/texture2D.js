import Texture from './texture';

// This exists for compatibility reason actually.
export default class Texture2D extends Texture {
  constructor(image, alpha = true, options = {
    mipmap: true,
    minFilter: 'linearMipmapLinear'
  }, name) {
    super(image, alpha ? 'rgba': 'rgb', 'uint8', options, name);
  }
  static fromImage(url, options) {
    let image = new Image();
    image.src = url;
    let texture = new Texture2D(image, true, options);
    return texture;
  }
}
