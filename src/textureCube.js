import Texture from './texture';

export default class TextureCube extends Texture {
  constructor(name) {
    super(name);
    this.type = 'cube';
    this.images = null;
  }
  isLoaded() {
    return this.images && this.images.every(image => image.complete);
  }
  load(images) {
    if (this.images != null) throw new Error('Texture is already loaded');
    if (images.length !== 6) throw new Error('Image size is not valid');
    this.images = images;
  }
  upload(gl) {
    // Do texture load (InternalTexture will bind the texture)
    this.images.map((image, index) => {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + index, 0, gl.RGBA,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    });
    // Texture configuration comes here
    // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER,
    //   gl.LINEAR_MIPMAP_LINEAR);
    // gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER,
      gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER,
      gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S,
      gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T,
      gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R,
      gl.CLAMP_TO_EDGE);
  }
  static fromImage(urls) {
    let texture = new TextureCube();
    texture.load(urls.map(url => {
      let image = new Image();
      image.src = url;
      return image;
    }));
    return texture;
  }
}
