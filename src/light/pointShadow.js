import Light from './light';
import Camera from '../camera';

import Framebuffer from '../framebuffer';
import Texture from '../texture';
import Renderbuffer from '../renderbuffer';
import RenderTask from '../renderTask';

import { vec3, quat } from 'gl-matrix';

export default class PointShadowLight extends Light {
  constructor(options) {
    super('pointShadow');
    this.camera = new Camera();
    quat.rotateY(this.camera.transform.rotation, this.camera.transform.rotation,
      -Math.PI / 2);
    this.camera.transform.invalidate();
    this.depthTexture = new Texture(null, 'depth', 'uint16', {
      minFilter: 'nearest',
      magFilter: 'nearest',
      wrapS: 'clamp',
      wrapT: 'clamp',
      mipmap: false
    });
    this.depthTexture.width = options.framebuffer.width;
    this.depthTexture.height = options.framebuffer.height;
    this.colorBuffer = new Renderbuffer('rgb565',
      options.framebuffer.width, options.framebuffer.height);
    this.framebuffer = new Framebuffer(this.colorBuffer, this.depthTexture);
    this.renderTask = new RenderTask(null, options.framebuffer.mode,
      this.framebuffer, options.framebuffer.defaultMaterial);
    this.renderTask.camera = this.camera;
    this.options = options;
  }
  validate() {
    let hasChanged = super.validate();
    if (hasChanged) {
      // Update camera data, if any
      Object.assign(this.camera.options, this.options.camera);
      this.camera.invalidate();
      this.camera.validate();
      // Create depth texture and framebuffer and render task
    }
    return hasChanged;
  }
  use() {
    let position = vec3.create();
    vec3.transformMat4(position, position, this.globalMatrix);
    return {
      position,
      color: this.options.color,
      intensity: new Float32Array([
        this.options.ambient, this.options.diffuse, this.options.specular,
        this.options.attenuation
      ]),
      shadowMatrix: this.camera.pvMatrix,
      shadowMap: this.depthTexture,
      globals: {
        uPointShadowLightShadowMap: this.depthTexture
      }
    };
  }
  update(context, parent) {
    super.update(context, parent);
    this.camera.update(context, this);
    context.addTask(this.renderTask);
  }
}
