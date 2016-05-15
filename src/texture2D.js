import Texture from './texture';

export default class Texture2D extends Texture {
  constructor(name) {
    super(name);
    this.type = '2d';
    this.image = null;
  }
  isLoaded() {
    return this.image && this.image.complete;
  }
  load(image) {
    if (this.image != null) throw new Error('Texture is already loaded');
    this.image = image;
  }
  upload(gl) {
    // Do texture load (InternalTexture will bind the texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
      this.image);
    // Texture configuration comes here
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  static fromImage(url) {
    let texture = new Texture2D();
    let image = new Image();
    image.src = url;
    texture.load(image);
    return texture;
  }
}
