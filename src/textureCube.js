import Texture from './texture';

// This exists for compatibility reason actually.
export default class TextureCube extends Texture {
  constructor(images, alpha = true, options = {
    mipmap: false,
    minFilter: 'linear',
    magFilter: 'linear',
    wrapS: 'clamp',
    wrapT: 'clamp'
  }, name) {
    super(images, alpha ? 'rgba': 'rgb', 'uint8', options, name);
    this.target = 'cube';
  }
  static fromImage(urls) {
    let texture = new TextureCube(urls.map(url => {
      let image = new Image();
      image.src = url;
      return image;
    }));
    return texture;
  }
}
