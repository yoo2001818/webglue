import Object3D from '../object3D';

export default class Light extends Object3D {
  constructor(type) {
    super();
    this.visible = true;
    this.type = type;
    this.valid = false;
    this.uniforms = {};
  }
  use() {
    return {};
  }
  validate() {
    let hasChanged = super.validate() || !this.valid;
    if (hasChanged) {
      this.valid = true;
    }
    return hasChanged;
  }
  invalidate() {
    this.valid = false;
  }
  update(context, parent) {
    super.update(context, parent);
    if (this.hasChanged) {
      this.uniforms = this.use();
    }
    if (this.visible) {
      context.addLight(this);
    }
  }
}
