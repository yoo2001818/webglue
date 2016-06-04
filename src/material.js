let ID = 0;

export default class Material {
  constructor(shader, name) {
    this.shader = shader;
    this.name = name || Symbol('material_' + (Math.random() * 1000 | 0));
    // ....
    this.numberId = ID ++;
    // If it dynamically changes (i.e. contains function value), this should
    // be true.
    this.update = false;
  }
  getShader(mode) {
    // If mode is not default, return null to allow user-defined behavior.
    if (mode !== 'default') return null;
    return this.shader;
  }
  use() {
    // Set material-specific uniforms here.
    // .... Abstraction to the rescue.
    return {};
  }
}
