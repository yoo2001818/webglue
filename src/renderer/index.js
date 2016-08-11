import ShaderManager from './shaderManager';
import GeometryManager from './geometryManager';

export default class Renderer {
  constructor(gl) {
    this.gl = gl;

    this.shaders = new ShaderManager(this);
    this.geometries = new GeometryManager(this);
  }
}
