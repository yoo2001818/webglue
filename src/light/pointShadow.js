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
    this.depthBuffer = new Renderbuffer('depth',
      options.framebuffer.width, options.framebuffer.height);
    this.colorTexture = new Texture(null, 'rgba', 'uint8', {
      minFilter: 'linear',
      magFilter: 'linear',
      wrapS: 'clamp',
      wrapT: 'clamp',
      mipmap: false
    });
    this.colorTexture.width = options.framebuffer.width;
    this.colorTexture.height = options.framebuffer.height;
    this.framebuffer = new Framebuffer(this.colorTexture, this.depthBuffer);
    this.renderTask = new RenderTask(null, options.framebuffer.mode,
      this.framebuffer, options.framebuffer.defaultMaterial, options.task);
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
      shadowMap: this.colorTexture,
      globals: {
        uPointShadowLightShadowMap: this.colorTexture
      }
    };
  }
  update(context, parent) {
    super.update(context, parent);
    this.camera.update(context, this);
    context.addTask(this.renderTask);
  }
}
