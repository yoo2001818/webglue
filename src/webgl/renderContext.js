import InternalShader from './internalShader';
import InternalGeometry from './internalGeometry';
import InternalTexture from './internalTexture';
import InternalFramebuffer from './internalFramebuffer';
import InternalRenderbuffer from './internalRenderbuffer';
import Metrics from './metrics';
import Scene from '../scene';
import RenderTask from '../renderTask';

const CULL_FACE = {
  front: 0x0404,
  back: 0x0405,
  both: 0x0408
};

const FRONT_FACE = {
  cw: 0x0900,
  ccw: 0x0901
};

const DEPTH_STENCIL_TEST = {
  never: 0x0200,
  always: 0x0207,
  less: 0x0201,
  equal: 0x0202,
  lequal: 0x0203,
  greater: 0x0204,
  gequal: 0x0206,
  notequal: 0x0205
};

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
      spot: 'uSpotLight',
      pointShadow: 'uPointShadowLight'
    };
    // Light type define names.
    this.lightDefines = {
      ambient: 'AMBIENT_LIGHT_SIZE',
      directional: 'DIRECTIONAL_LIGHT_SIZE',
      point: 'POINT_LIGHT_SIZE',
      spot: 'SPOT_LIGHT_SIZE',
      pointShadow: 'POINT_SHADOW_LIGHT_SIZE'
    };
    // Light size uniform offsets.
    // Currently this uses ivec4 array, however it can be changed later.
    this.lightSizeUniform = 'uLightSize';
    this.lightSizePos = [
      'ambient', 'directional', 'point', 'spot', 'pointShadow'
    ];
    // Default WebGL context options.
    this.defaultOptions = {
      clearColor: [57 / 255, 57 / 255, 57 / 255, 1],
      // clearDepth: 1,
      // clearStencil: 0,
      // colorMask: [true, true, true, true],
      cullFace: 'back',
      frontFace: 'ccw',
      // blend: false,
      depthTest: 'lequal'
      // scissorTest: false,
      // stencilTest: false
    };
    // Reset the GL context data (It's null at this stage though)
    this.resetContext();
    this.loadingTextures = [];

    // Remains for compatibility. Will be removed soon.
    this.mainScene = new Scene();
    this.tasks = [
      new RenderTask(this.mainScene)
    ];
    this.cameraChanged = 0;
    // Time elapsed between two frames. Caller should set this value.
    this.deltaTime = 1 / 60;

    this.metrics = new Metrics();
  }
  render() {
    const gl = this.gl;
    // Ignore if context is lost.
    if (gl.isContextLost()) return;
    this.globalTickId ++;
    this.handleLoadingTextures();
    this.metrics.reset();
    // Read each render task, and perform rendering
    for (let i = 0; i < this.tasks.length; ++i) {
      let task = this.tasks[i];
      this.renderTask(task, this.mainScene, true);
    }
  }
  renderTask(task, parentScene, followSub) {
    const gl = this.gl;
    let scene = task.scene || parentScene;
    // Finalize the scene
    scene.finalize();
    // If sub-task exists, render them first.
    if (scene.tasks && followSub) {
      for (let i = 0; i < scene.tasks.length; ++i) {
        let subTask = scene.tasks[i];
        if (subTask === task) continue;
        this.renderTask(subTask, scene, scene !== (subTask.scene || scene));
      }
    }
    if (scene.camera == null) {
      throw new Error('Camera is not specified in the scene!');
    }
    this.useFramebuffer(task.target);
    // Set viewport to framebuffer sizes.
    let width;
    let height;
    if (task.target != null) {
      let framebuffer = this.currentFramebuffer;
      gl.viewport(0, 0, framebuffer.width, framebuffer.height);
      width = framebuffer.width;
      height = framebuffer.height;
    } else {
      // Or just use screen size.
      gl.viewport(0, 0, this.width, this.height);
      width = this.width;
      height = this.height;
    }
    // This is kinda awkward, however this sets the camera information.
    this.camera = task.camera || scene.camera;
    // Validate camera aspect ratio.
    this.camera.validateAspect(width / height);
    // The render mode.
    this.mode = task.mode;
    this.defaultMaterial = task.defaultMaterial;
    // Construct light buffer data using scene lights
    this.lightDefineData = null;
    this.updateLights(scene.lights);
    // Set current OpenGL state if scene's options exist.
    this.setOptions(task.options || this.defaultOptions);
    // Clear current OpenGL context. (Is this really necessary?)
    // TODO Remove stencil buffer?
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (this.currentShader) {
      this.useCamera(this.camera);
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
    this.framebuffers = {};
    this.renderbuffers = {};

    // User should not set this value - this will be overrided anyway.
    this.lightDefineData = null;
    this.lightUniformData = {};
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
    this.currentFramebuffer = null;
    // This defaults to back
    this.currentCullFace = gl.BACK;
    this.globalTickId = 0;
    this.renderTickId = 0;
    this.textureBindId = 0;
    this.lightChanged = 0;
    this.cameraChanged = 0;

    this.maxTextures = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

    // Enable vao extension, if exists.
    this.vaoExt = gl.getExtension('OES_vertex_array_object');
    // Enable uint extension.
    this.uintExt = gl.getExtension('OES_element_index_uint');
    // Enable standard derivatives extension.
    this.derivativesExt = gl.getExtension('OES_standard_derivatives');

    // Set drawing buffer size.
    this.width = gl.drawingBufferWidth;
    this.height = gl.drawingBufferHeight;

    // Set current options information to default state.
    this.currentOptions = {
      cullFace: false,
      depthTest: false
    };
    // Actually set the options at WebGL side.
    this.setOptions(this.defaultOptions);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  setOptions(options) {
    const gl = this.gl;
    // Set WebGL options and write it to the currentOptions.
    // TODO Each geometry / mesh / material can have different value for this -
    // we have to process this per-mesh. (Especially culling; all other values
    // can be processed only by render context or mesh, however culling acts
    // like XOR.)
    for (let key in options) {
      let value = options[key];
      let previous = this.currentOptions[key];
      if (previous === value) continue;
      // I hate this so much.
      switch (key) {
      case 'clearColor':
        gl.clearColor.apply(gl, value);
        break;
      case 'cullFace':
        if (previous === false) gl.enable(gl.CULL_FACE);
        if (value === false) gl.disable(gl.CULL_FACE);
        gl.cullFace(CULL_FACE[value]);
        break;
      case 'frontFace':
        gl.frontFace(FRONT_FACE[value]);
        break;
      case 'depthTest':
        if (previous === false) gl.enable(gl.DEPTH_TEST);
        if (value === false) gl.disable(gl.DEPTH_TEST);
        gl.depthFunc(DEPTH_STENCIL_TEST[value]);
        break;
      }
    }
  }
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }
  useCamera(camera) {
    const gl = this.gl;
    const shader = this.currentShader;
    const uniforms = shader.uniforms;
    let cameraUpdateTick = this.currentCamera[shader.name];
    if (cameraUpdateTick != null && cameraUpdateTick > this.renderTickId) {
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
    let lightSizeVec = [];
    for (let i = 0; i < this.lightSizePos.length; i += 4) {
      lightSizeVec.push(new Int32Array(4));
    }
    let lightsBuf = {};
    for (let type in lights) {
      let typeName = this.lightUniforms[type];
      if (typeName == null) {
        throw new Error('Light type ' + type + ' is not specified in ' +
          'uniform list');
      }
      let lightsArray = lights[type];
      lightsBuf[typeName] = lightsArray;

      // Iterate through lights array and process global variables.
      for (let i = 0; i < lightsArray.length; ++i) {
        let light = lightsArray[i];
        if (light.globals == null) continue;
        for (let key in light.globals) {
          // Check if lightsBuf has that key - create empty array if there
          // is not.
          if (lightsBuf[key] == null) {
            lightsBuf[key] = [];
          }
          // Insert the global variable to the array.
          lightsBuf[key].push(light.globals[key]);
        }
      }

      let typeSizePos = this.lightSizePos.indexOf(type);
      lightSizeVec[typeSizePos >> 2][typeSizePos % 4] = lightsArray.length;
      this.metrics.lights += lightsArray.length;
    }
    lightsBuf[this.lightSizeUniform] = lightSizeVec;
    this.lights = lights;
    this.lightUniformData = lightsBuf;
  }
  getLightDefines() {
    if (this.lightDefineData !== null) return this.lightDefineData;
    let lightDefineData = '';
    Object.keys(this.lightDefines).forEach(type => {
      let lightsArray = this.lights[type];
      let size = lightsArray == null ? 0 : lightsArray.length;
      lightDefineData += '#define ' + this.lightDefines[type] + ' ' +
        size + '\n';
    });
    this.lightDefineData = lightDefineData;
    return this.lightDefineData;
  }
  useLights() {
    let shader = this.currentShader;
    let lightUpdateTick = this.currentLight[shader.name];
    if (lightUpdateTick != null && lightUpdateTick >= this.renderTickId) {
      return;
    }
    this.bindUniforms(this.lightUniformData, shader.uniforms,
      shader.uniformTypes);
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
      this.currentMode[shader.name] === this.mode &&
      !material.update
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
      // If function is provided, execute that function to retrieve the value.
      if (typeof value === 'function') {
        value = value(this);
      }
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
        gl.uniformMatrix2fv(key, false, value);
        break;
      case gl.FLOAT_MAT3:
        gl.uniformMatrix3fv(key, false, value);
        break;
      case gl.FLOAT_MAT4:
        gl.uniformMatrix4fv(key, false, value);
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
    // We can do a ignore-check if geometry is same and valid.
    if (geometry.valid && this.currentGeometry &&
      geometry.name === this.currentGeometry.name
    ) {
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
      if (!geometry.valid) {
        internalGeometry.upload(this, geometry);
        geometry.valid = true;
      }
      // If geometry object exists, just call it.
      internalGeometry.use(this, geometry);
      this.currentGeometry = internalGeometry;
    } else {
      // If it doesn't, create new one.
      internalGeometry = new InternalGeometry();
      internalGeometry.upload(this, geometry);
      geometry.valid = true;
      this.geometries[geometry.name] = internalGeometry;
      internalGeometry.use(this, geometry);
      this.currentGeometry = internalGeometry;
      this.metrics.geometries ++;
    }
    this.metrics.geometryCalls ++;
  }
  useTexture(texture, reupload = false) {
    let internalTexture = this.textures[texture.name];
    // Create new texture object if it doesn't exist.
    if (internalTexture == null) {
      internalTexture = new InternalTexture();
      internalTexture.init(this, texture);
      this.textures[texture.name] = internalTexture;
      this.metrics.textures ++;
    } else {
      // If it exists, we can easily check if the texture already exists on
      // the bank.
      if (internalTexture.unitId !== -1) {
        // Update LRU age data to latest age
        internalTexture.lastUsed = this.textureBindId ++;
        if (reupload) {
          internalTexture.reupload(this, texture, internalTexture.unitId);
        }
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
    if (reupload) internalTexture.reupload(this, texture, leastId);
    if (!internalTexture.loaded || internalTexture.update) {
      this.loadingTextures.push(texture);
    }
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
      if ((!internalTexture.update && internalTexture.loaded) || index === -1) {
        this.loadingTextures.splice(i, 1);
        i --;
        continue;
      }
      internalTexture.upload(this, texture, index);
    }
  }
  getRenderbuffer(renderbuffer) {
    let internalRenderbuffer = this.renderbuffers[renderbuffer.name];
    if (internalRenderbuffer && internalRenderbuffer.loaded) {
      if (renderbuffer.width == null || renderbuffer.height == null) {
        // Check screen size
        if (internalRenderbuffer.width !== this.width ||
          internalRenderbuffer.height !== this.height
        ) {
          internalRenderbuffer.reupload(this, renderbuffer);
        }
      }
      return internalRenderbuffer;
    } else {
      // Create render buffer.
      internalRenderbuffer = new InternalRenderbuffer();
      internalRenderbuffer.upload(this, renderbuffer);
      this.renderbuffers[renderbuffer.name] = internalRenderbuffer;
    }
    return internalRenderbuffer;
  }
  getTexture(texture) {
    let internalTexture = this.textures[texture.name];
    // TODO Check screen size
    // If already loaded, we can silently ignore that.
    if (internalTexture && internalTexture.loaded) {
      if (texture.source == null &&
        (texture.width == null || texture.height == null)
      ) {
        // Check screen size
        if (internalTexture.width !== this.width ||
          internalTexture.height !== this.height
        ) {
          // Reupload texture data if size mismatches
          this.useTexture(texture, true);
        }
      }
      return internalTexture;
    } else {
      // Otherwise, initialize texture. Maybe binding and reverting can be
      // faster, however I'll test it later. TODO
      this.useTexture(texture);
      return this.textures[texture.name];
    }
  }
  useFramebuffer(framebuffer) {
    if (this.currentFramebuffer === null && framebuffer == null) {
      // Default framebuffer - don't do anything.
      return;
    }
    if (this.currentFramebuffer !== null && framebuffer != null &&
      framebuffer.name === this.currentFramebuffer.name
    ) {
      // Ignore if framebuffer is already being used.
      // However we have to do resizing textures, etc.
      return;
    }
    const gl = this.gl;
    if (framebuffer == null) {
      // Default framebuffer doesn't need anything - we just bind them.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.currentFramebuffer = null;
      return;
    }
    let internalFramebuffer = this.framebuffers[framebuffer.name];
    if (internalFramebuffer == null) {
      // Create framebuffer object if it doesn't exists.
      internalFramebuffer = new InternalFramebuffer();
      internalFramebuffer.upload(this, framebuffer);
      this.framebuffers[framebuffer.name] = internalFramebuffer;
    }
    // Use the framebuffer - done!
    internalFramebuffer.use(this, framebuffer);
    this.currentFramebuffer = internalFramebuffer;
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
  // Delegation methods for compatibility.
  addMesh(mesh) {
    return this.mainScene.addMesh(mesh);
  }
  addLight(light) {
    return this.mainScene.addLight(light);
  }
  addTask(task) {
    return this.mainScene.addTask(task);
  }
}
