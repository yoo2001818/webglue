import InternalShader from './internalShader';
import InternalGeometry from './internalGeometry';
import InternalTexture from './internalTexture';
import Metrics from './metrics';
import Scene from '../scene';
import RenderTask from '../renderTask';

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
    // Light type uniform names.
    this.lightUniforms = {
      ambient: 'uAmbientLight',
      directional: 'uDirectionalLight',
      point: 'uPointLight',
      spot: 'uSpotLight'
    };
    // Light size uniform offsets.
    // Currently this uses ivec4, it should be changed if there is more than
    // 4 types of light.
    this.lightSizeUniform = 'uLightSize';
    this.lightSizePos = {
      ambient: 0,
      directional: 1,
      point: 2,
      spot: 3
    };
    // Reset the GL context data (It's null at this stage though)
    this.resetContext();
    this.loadingTextures = [];
    this.maxTextures = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

    // Remains for compatibility. Will be removed soon.
    this.mainScene = new Scene();
    this.tasks = [
      new RenderTask(this.mainScene)
    ];
    this.cameraChanged = 0;
    // Time elapsed between two frames. Caller should set this value.
    this.deltaTime = 1 / 60;
    // Enable vao extension, if exists.
    this.vaoExt = gl.getExtension('OES_vertex_array_object');

    this.metrics = new Metrics();
  }
  render() {
    const gl = this.gl;
    // Ignore if context is lost.
    if (gl.isContextLost()) return;
    this.handleLoadingTextures();
    this.metrics.reset();
    // Read each render task, and perform rendering
    for (let i = 0; i < this.tasks.length; ++i) {
      let task = this.tasks[i];
      this.renderTask(task);
    }
  }
  renderTask(task) {
    const gl = this.gl;
    let scene = task.scene;
    // Finalize the scene
    scene.finalize();
    // If sub-task exists, render them first.
    if (scene.tasks) {
      for (let i = 0; i < scene.tasks.length; ++i) {
        let subTask = scene.tasks[i];
        this.renderTask(subTask);
      }
    }
    if (scene.camera == null) {
      throw new Error('Camera is not specified in the scene!');
    }
    // This is kinda awkward, however this sets the camera information.
    this.camera = task.camera || scene.camera;
    // The render mode.
    this.mode = task.mode;
    this.defaultMaterial = task.defaultMaterial;
    // Construct light buffer data using scene lights
    this.updateLights(scene.lights);
    // Clear current OpenGL context. (Is this really necessary?)
    // TODO Remove stencil buffer?
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (scene.camera.hasChanged) {
      this.cameraChanged = this.renderTickId;
    }
    if (this.currentShader && scene.camera.hasChanged) {
      this.useCamera(scene.camera);
    }
    if (this.currentShader) {
      this.useLights();
    }
    // Render every mesh, one at a time.
    for (let i = 0; i < scene.meshes.length; ++i) {
      this.renderMesh(scene.meshes[i]);
    }
    // Since each render task performs rendering whole scene one time,
    // (Scene differs though) we have to increment render tick ID in order
    // to prevent confliction.
    this.renderTickId ++;
  }
  // Resets current render context.
  reset() {
    this.mainScene.reset();
  }
  resetContext() {
    const gl = this.gl;
    // Remove all the resources and stuff already bound - It's lost in GPU!
    // We can use a Map instead of object.
    this.shaders = {};
    this.textures = {};
    this.geometries = {};

    // User should not set this value - this will be overrided anyway.
    this.lights = {};
    this.camera = null;
    this.mode = 'default';
    this.defaultMaterial = null;

    this.currentShader = null;
    this.currentGeometry = null;
    this.currentMaterial = {};
    this.currentMode = {};
    this.currentCamera = {};
    this.currentLight = {};
    this.currentTextures = [];
    // This defaults to back
    this.currentCullFace = gl.BACK;
    this.renderTickId = 0;
    this.textureBindId = 0;
    this.lightChanged = 0;
    this.cameraChanged = 0;

    this.maxTextures = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    // Enable vao extension, if exists.
    this.vaoExt = gl.getExtension('OES_vertex_array_object');

    // Set drawing buffer size.
    this.width = gl.drawingBufferWidth;
    this.height = gl.drawingBufferHeight;

    // OpenGL init.
    // TODO this should be modifiable by the user
    gl.clearColor(57 / 255, 57 / 255, 57 / 255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.gl.viewport(0, 0, width, height);
  }
  useCamera(camera) {
    const gl = this.gl;
    const shader = this.currentShader;
    const uniforms = shader.uniforms;
    let cameraUpdateTick = this.currentCamera[shader.name];
    if (cameraUpdateTick != null && cameraUpdateTick > this.cameraChanged) {
      return;
    }
    // Set current camera. Basically it sets some uniform stuff.
    // PV matrix + M matrix + view location -> 35 floats.
    // P + V + M matrix -> 48 floats.
    // So It'd be beneficial to send PV matrix to the GPU.
    if (uniforms.uProjectionView) {
      gl.uniformMatrix4fv(uniforms.uProjectionView, false, camera.pvMatrix);
    }
    if (uniforms.uProjection) {
      gl.uniformMatrix4fv(uniforms.uProjection, false, camera.projectMatrix);
    }
    if (uniforms.uView) {
      gl.uniformMatrix4fv(uniforms.uView, false, camera.inverseMatrix);
    }
    if (uniforms.uViewInv) {
      gl.uniformMatrix4fv(uniforms.uViewInv, false, camera.globalMatrix);
    }
    if (uniforms.uViewPos) {
      gl.uniform3fv(uniforms.uViewPos, camera.transform.position);
    }
    this.currentCamera[shader.name] = this.renderTickId;
  }
  updateLights(lights) {
    // Construct lights buffer (on CPU) using provided lights data.
    let lightSizeVec = new Int32Array(4);
    let lightsBuf = {};
    for (let type in lights) {
      let typeName = this.lightUniforms[type];
      if (typeName == null) {
        throw new Error('Light type ' + type + ' is not specified in ' +
          'uniform list');
      }
      lightsBuf[typeName] = lights[type];

      let typeSizePos = this.lightSizePos[type];
      lightSizeVec[typeSizePos] = lights[type].length;
      this.metrics.lights += lights[type].length;
    }
    lightsBuf[this.lightSizeUniform] = lightSizeVec;
    this.lights = lightsBuf;
  }
  useLights() {
    let shader = this.currentShader;
    let lightUpdateTick = this.currentLight[shader.name];
    if (lightUpdateTick != null && lightUpdateTick >= this.renderTickId) {
      return;
    }
    this.bindUniforms(this.lights, shader.uniforms, shader.uniformTypes);
    this.currentLight[shader.name] = this.renderTickId;
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
      this.metrics.shaders ++;
    }
    this.metrics.shaderCalls ++;
    // Reset camera location.
    this.useCamera(this.camera);
    this.useLights();
  }
  useMaterial(material) {
    let internalShader = material && material.getShader(this.mode);
    if (internalShader == null) {
      // If returned value is null, retry with default shader.
      if (this.defaultMaterial === material) {
        // However if provided object is default material, this will cause
        // an infinite loop. In order to avoid that, if we encounter default
        // material, consider it failed and return false.
        return false;
      }
      return this.useMaterial(this.defaultMaterial);
    }
    // Use the shader in the material.
    this.useShader(internalShader);
    let shader = this.currentShader;
    // If the material is already being used, ignore it.
    // (However, since we don't have a 'InternalMaterial', it's alright to
    // check like this)
    if (this.currentMaterial[shader.name] === material &&
      this.currentMode[shader.name] === this.mode
    ) {
      return true;
    }
    // Then, call the material's use method.
    let uniforms = material.use(this.mode);
    this.bindUniforms(uniforms, shader.uniforms, shader.uniformTypes);
    // Done!
    this.currentMaterial[shader.name] = material;
    this.currentMode[shader.name] = this.mode;
    this.metrics.materialCalls ++;
    return true;
  }
  bindUniforms(values, uniforms, uniformTypes) {
    const gl = this.gl;
    if (uniforms == null) return;
    for (let name in values) {
      let value = values[name];
      let key = uniforms[name];
      let typeId = uniformTypes[name];
      if (key == null) continue;
      // I'm not sure if this is good way to do it... Probably bad.
      if (!(key instanceof WebGLUniformLocation)) {
        // Array can be handled with this too
        this.bindUniforms(value, key, typeId);
        continue;
      }
      switch (typeId) {
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
      this.metrics.geometries ++;
    }
    this.metrics.geometryCalls ++;
  }
  useTexture(texture) {
    let internalTexture = this.textures[texture.name];
    // Create new texture object if it doesn't exist.
    if (internalTexture == null) {
      internalTexture = new InternalTexture();
      internalTexture.upload(this, texture);
      this.textures[texture.name] = internalTexture;
      this.metrics.textures ++;
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
    this.metrics.textureCalls ++;
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
    // Try setting the material.
    if (!this.useMaterial(mesh.material)) {
      // If it failed, this means that no material is available - just don't
      // render the mesh.
      return;
    }
    // Set the model matrix and stuff.
    const uniforms = this.currentShader.uniforms;
    const gl = this.gl;
    if (uniforms.uModel) {
      gl.uniformMatrix4fv(uniforms.uModel, false, mesh.globalMatrix);
    }
    if (uniforms.uModelInvTransp) {
      gl.uniformMatrix3fv(uniforms.uModelInvTransp, false, mesh.normalMatrix);
    }
    this.useGeometry(mesh.geometry, prevShader);
    this.currentGeometry.render(this, mesh.geometry);
    this.metrics.meshCalls ++;
  }
  // Delegation methodx for compatibility.
  addMesh(mesh) {
    return this.mainScene.addMesh(mesh);
  }
  addLight(light) {
    return this.mainScene.addLight(light);
  }
}
