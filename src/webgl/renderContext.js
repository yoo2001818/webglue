import InternalShader from './internalShader';
import InternalGeometry from './internalGeometry';

export default class RenderContext {
  constructor(gl) {
    this.gl = gl;
    // I don't think it's okay to bind attributes like this - I've seen that
    // NVIDIA GPU reserves some attribute IDs, so it may be fixed later.
    this.sharedAttributes = {
      aPosition: 0,
      aNormal: 1,
      aTangent: 2,
      aTexCoord: 3
    };
    // We can use a Map instead.
    this.shaders = {};
    this.textures = {};
    this.geometries = {};
    this.currentShader = null;
    this.currentGeometry = null;
    this.currentMaterial = null;
    // This properties actually connect to the 'non-platform specific'
    // objects, such as lights, meshes, camera, etc.
    this.lights = [];
    this.meshes = [];
    this.camera = null;
    // Enable vao extension, if exists.
    this.vaoExt = gl.getExtension('OES_vertex_array_object');
  }
  render() {
    const gl = this.gl;
    // Clear current OpenGL context.
    // TODO Remove stencil buffer?
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (this.currentShader) this.useCamera(this.camera);
    // Render every mesh, one at a time.
    for (let i = 0; i < this.meshes.length; ++i) {
      this.renderMesh(this.meshes[i]);
    }
  }
  // Resets current render context.
  reset() {
    // TODO Instead of doing this, Maybe it'd be better to use the array as a
    // queue and delete everything at render time?
    // (Though it won't really matter.)
    this.lights = [];
    this.meshes = [];
    this.camera = null;

    this.currentShader = null;
    this.currentGeometry = null;
    this.currentMaterial = null;
  }
  useCamera(camera) {
    const gl = this.gl;
    const shader = this.currentShader;
    const uniforms = shader.uniforms;
    // Set current camera. Basically it sets some uniform stuff.
    // PV matrix + M matrix + view location -> 35 floats.
    // P + V + M matrix -> 48 floats.
    // So It'd be beneficial to send PV matrix to the GPU.
    if (uniforms.uProjectionView) {
      gl.uniformMatrix4fv(uniforms.uProjectionView, false, camera.pvMatrix);
    }
    if (uniforms.uViewPos) {
      gl.uniform3fv(uniforms.uViewPos, camera.transform.position);
    }
  }
  useShader(shader) {
    // If the shader is already being used, just ignore it.
    if (this.currentShader && this.currentShader.name === shader.name) return;
    let internalShader = this.shaders[shader.name];
    if (internalShader) {
      // If the shader exists, just call it.
      internalShader.use(this);
      this.currentShader = internalShader;
    } else {
      // Or if it doesn't, upload it and use it.
      internalShader = new InternalShader();
      internalShader.upload(this, shader);
      this.shaders[shader.name] = internalShader;
      internalShader.use(this);
      this.currentShader = internalShader;
    }
    // Reset camera location.
    this.useCamera(this.camera);
  }
  useMaterial(material) {
    // If the material is already being used, ignore it.
    // (However, since we don't have a 'InternalMaterial', it's alright to
    // check like this)
    if (this.currentMaterial === material) return;
    // Use the shader in the material.
    this.useShader(material.shader);
    // Then, call the material's use method.
    material.use(this.gl, this.currentShader);
    // Done!
    this.currentMaterial = material;
  }
  useGeometry(geometry, previousShader) {
    // We can do a ignore-check if geometry is same.
    if (this.currentGeometry && geometry.name === this.currentGeometry.name) {
      // If previous shader and current shader is same, just ignore it.
      if (this.currentShader === previousShader) return;
      // Or if both shader follows the shared attributes, we can ignore it.
      if (this.currentShader.shared && previousShader &&
        previousShader.shared
      ) return;
    }
    // Otherwise, we need to apply the geometry.
    let internalGeometry = this.geometries[geometry.name];
    if (internalGeometry) {
      // If geometry object exists, just call it.
      internalGeometry.use(this, geometry);
      this.currentGeometry = internalGeometry;
    } else {
      // If it doesn't, create new one.
      internalGeometry = new InternalGeometry();
      internalGeometry.upload(this, geometry);
      this.geometries[geometry.name] = internalGeometry;
      internalGeometry.use(this, geometry);
      this.currentGeometry = internalGeometry;
    }
  }
  renderMesh(mesh) {
    let prevShader = this.currentShader;
    this.useMaterial(mesh.material);
    // Set the model matrix and stuff.
    const uniforms = this.currentShader.uniforms;
    const gl = this.gl;
    if (uniforms.uModel) {
      gl.uniformMatrix4fv(uniforms.uModel, false, mesh.globalMatrix);
    }
    this.useGeometry(mesh.geometry, prevShader);
    this.currentGeometry.render(this, mesh.geometry);
  }
}
