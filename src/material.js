export default class Material {
  constructor(shader, name) {
    this.shader = shader;
    this.name = name || Symbol('material_' + (Math.random() * 1000 | 0));
  }
  use() {
    // Set material-specific uniforms here.
  }
}
