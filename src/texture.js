export default class Texture {
  constructor(name) {
    this.type = '2d';
    this.name = name || Symbol('texture_' + (Math.random() * 1000 | 0));
  }
  isLoaded() {
    return false;
  }
  upload() {
    // Do texture load (InternalTexture will bind the texture)
    throw new Error('Subclass did not implement texture uploading');
  }
}
