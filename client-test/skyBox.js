import Shader from 'webglue/shader';
import Material from 'webglue/material';

import Mesh from 'webglue/mesh';

import BoxGeometry from 'webglue/boxGeometry';

const SKYBOX_GEOM = new BoxGeometry();
SKYBOX_GEOM.cullFace = 'front';

const SHADER = new Shader(
  require('./shader/skybox.vert'), require('./shader/skybox.frag')
);

export default class SkyBox extends Mesh {
  constructor(texture) {
    let material = new Material(SHADER);
    material.use = () => ({
      uSkybox: texture
    });
    super(SKYBOX_GEOM, material);
  }
}
