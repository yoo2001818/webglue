let ID = 0;

export default class Material {
  constructor(shader, name) {
    this.shader = shader;
    this.name = name || Symbol('material_' + (Math.random() * 1000 | 0));
    // ....
    this.numberId = ID ++;
  }
  use() {
    // Set material-specific uniforms here.
    // .... Abstraction to the rescue.
    return {};
  }
}
