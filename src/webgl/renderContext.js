import InternalShader from './internalShader';
import InternalGeometry from './internalGeometry';
import InternalTexture from './internalTexture';

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
    this.currentTextures = [];
    this.loadingTextures = [];
    this.maxTextures = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    this.textureBindId = 0;
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
    this.handleLoadingTextures();
    if (this.currentShader && this.camera.hasChanged) {
      this.useCamera(this.camera);
    }
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
    const gl = this.gl;
    // Use the shader in the material.
    this.useShader(material.shader);
    // Then, call the material's use method.
    let shader = this.currentShader;
    let uniforms = material.use();
    for (let name in uniforms) {
      let value = uniforms[name];
      let key = shader.uniforms[name];
      if (key == null) continue;
      // Why Why Why Why WHY
      // Maybe we should move this to somewhere else, to process lightning
      // and stuff easily.
      switch (shader.uniformTypes[name]) {
      case gl.FLOAT_VEC2:
        gl.uniform2fv(key, value);
        break;
      case gl.FLOAT_VEC3:
        gl.uniform3fv(key, value);
        break;
      case gl.FLOAT_VEC4:
        gl.uniform4fv(key, value);
        break;
      case gl.INT_VEC2:
      case gl.BOOL_VEC2:
        gl.uniform2iv(key, value);
        break;
      case gl.INT_VEC3:
      case gl.BOOL_VEC3:
        gl.uniform3iv(key, value);
        break;
      case gl.INT_VEC4:
      case gl.BOOL_VEC4:
        gl.uniform4iv(key, value);
        break;
      case gl.BOOL:
      case gl.BYTE:
      case gl.UNSIGNED_BYTE:
      case gl.SHORT:
      case gl.UNSIGNED_SHORT:
      case gl.INT:
      case gl.UNSIGNED_INT:
        gl.uniform1i(key, value);
        break;
      case gl.FLOAT:
        gl.uniform1f(key, value);
        break;
      case gl.FLOAT_MAT2:
        gl.uniformMatrix2fv(key, value);
        break;
      case gl.FLOAT_MAT3:
        gl.uniformMatrix3fv(key, value);
        break;
      case gl.FLOAT_MAT4:
        gl.uniformMatrix4fv(key, value);
        break;
      case gl.SAMPLER_2D:
      case gl.SAMPLER_CUBE:
        // Apply texture...
        gl.uniform1i(key, this.useTexture(value));
        break;
      }
    }
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
  useTexture(texture) {
    let internalTexture = this.textures[texture.name];
    // Create new texture object if it doesn't exist.
    if (internalTexture == null) {
      internalTexture = new InternalTexture();
      internalTexture.upload(this, texture);
      this.textures[texture.name] = internalTexture;
    } else {
      // If it exists, we can easily check if the texture already exists on
      // the bank.
      if (internalTexture.unitId !== -1) {
        // Update LRU age data to latest age
        internalTexture.lastUsed = this.textureBindId ++;
        return internalTexture.unitId;
      }
      // If not, just proceed to upload step.
    }
    internalTexture.lastUsed = this.textureBindId ++;
    // Scan through the texture cache and select least recently used texture.
    // Or if empty texture slot exists, just select it.
    let leastAge = -1, leastId = 0;
    for (let i = 0; i < this.maxTextures; ++i) {
      if (this.currentTextures[i] == null) {
        leastId = i;
        break;
      }
      if (leastAge === -1 || leastAge >= this.currentTextures[i].lastUsed) {
        leastId = i;
        leastAge = this.currentTextures[i].lastUsed;
      }
    }
    // Use the selected texture slot.
    if (this.currentTextures[leastId] != null) {
      this.currentTextures[leastId].unitId = -1;
    }
    this.currentTextures[leastId] = internalTexture;
    internalTexture.unitId = leastId;
    internalTexture.use(this, texture, leastId);
    if (!internalTexture.loaded) this.loadingTextures.push(texture);
    return leastId;
  }
  handleLoadingTextures() {
    for (let i = 0; i < this.loadingTextures.length; ++i) {
      let texture = this.loadingTextures[i];
      let internalTexture = this.textures[texture.name];
      let index = internalTexture.unitId;
      // If the texture is unloaded from the GPU, it'll be re-added when
      // it's loaded again - so we can remove it.
      // If texture is already loaded - trivially we can remove it.
      if (internalTexture.loaded || index === -1) {
        this.loadingTextures.splice(i, 1);
        i --;
        continue;
      }
      internalTexture.load(this, texture, index);
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
