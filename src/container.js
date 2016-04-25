import Object3D from './object3D';

export default class Container extends Object3D {
  constructor() {
    super();
    this.children = [];
  }
  appendChild(child) {
    if (this.hasChild(child)) return;
    this.children.push(child);
  }
  hasChild(child) {
    return this.getChildIndex(child) !== -1;
  }
  getChildIndex(child) {
    return this.children.indexOf(child);
  }
  removeChild(child) {
    let index = this.getChildIndex(child);
    if (index === -1) return;
    this.children.splice(index, 1);
  }
  update(context, parent) {
    super.update(context, parent);
    // Call all children in order
    for (let i = 0; i < this.children.length; ++i) {
      this.children[i].update(context, this);
    }
  }
}
