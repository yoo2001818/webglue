import Texture from './texture';

// This exists for compatibility reason actually.
export default class Texture2D extends Texture {
  constructor(image, alpha = true, options = {
    mipmap: true,
    minFilter: 'nearestMipmapLinear'
  }, name) {
    super(image, alpha ? 'rgba': 'rgb', 'uint8', options, name);
  }
  static fromImage(url) {
    let image = new Image();
    image.src = url;
    let texture = new Texture2D(image);
    return texture;
  }
}
