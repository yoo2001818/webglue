// Do I really need separate class for saving metrics data?

export default class Metrics {
  constructor() {
    // Total vertices saved in array buffer.
    this.vertices = 0;
    // Total vertices used in indices buffer.
    this.activeVertices = 0;
    // Total triangles rendered.
    this.triangles = 0;
    // Count of draw calls.
    this.drawCalls = 0;
    // Count of shader calls.
    this.shaderCalls = 0;
    // Count of texture swap calls.
    this.textureCalls = 0;
    // Count of geometry swap calls.
    this.geometryCalls = 0;
    // Count of material swap calls.
    this.materialCalls = 0;
    // Count of meshs.
    this.meshCalls = 0;
    // Count of shaders uploaded to GPU.
    this.shaders = 0;
    // Count of textures uploaded to GPU.
    this.textures = 0;
    // Count of geometries uploaded to GPU.
    this.geometries = 0;
    // Count of lights on the scene.
    this.lights = 0;
  }
  reset() {
    this.vertices = 0;
    this.activeVertices = 0;
    this.triangles = 0;
    this.drawCalls = 0;
    this.shaderCalls = 0;
    this.textureCalls = 0;
    this.geometryCalls = 0;
    this.materialCalls = 0;
    this.meshCalls = 0;
  }
}
