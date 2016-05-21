// A class holding the 'scene', which is a list containing every renderable
// objects. This is different from Container, as this doesn't have a
// hierarchy - all objects are placed in flat structure.
export default class Scene {
  constructor() {
    this.reset();
  }
  reset() {
    this.meshes = [];
    this.lights = {};
    this.tasks = [];
    this.finalized = false;
    // Don't reset the camera - as the user may reuse it.
    // this.camera = null;
  }
  addMesh(mesh) {
    this.meshes.push(mesh);
  }
  addLight(light) {
    if (this.lights[light.type] == null) {
      this.lights[light.type] = [];
    }
    this.lights[light.type].push(light.uniforms);
  }
  finalize() {
    // Called by RenderContext to sort the meshes, etc.
    if (this.finalized) return;
    this.meshes.sort((a, b) => {
      let aShader = a.material.shader.numberId;
      let bShader = b.material.shader.numberId;
      if (aShader != bShader) {
        return aShader - bShader;
      }
      return a.material.numberId - b.material.numberId;
    });
    this.finalized = true;
  }
}
