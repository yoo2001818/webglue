import ShaderManager from './shaderManager';
import GeometryManager from './geometryManager';
import StateManager from './stateManager';

export default class Renderer {
  constructor(gl) {
    this.gl = gl;

    this.shaders = new ShaderManager(this);
    this.geometries = new GeometryManager(this);
    this.state = new StateManager(this);
  }
}
