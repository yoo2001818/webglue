import Light from './light';

export default class AmbientLight extends Light {
  constructor(options) {
    super('ambient');
    this.options = options;
  }
  use() {
    return {
      color: this.options.color,
      intensity: this.options.ambient
    };
  }
}
