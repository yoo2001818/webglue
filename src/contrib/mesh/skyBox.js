import Shader from '../../shader';
import Material from '../../material';

import Mesh from '../../mesh';

import BoxGeometry from '../../geom/boxGeometry';

const SKYBOX_GEOM = new BoxGeometry();
SKYBOX_GEOM.cullFace = 'front';

const SHADER = new Shader(
  require('../shader/skybox.vert'), require('../shader/skybox.frag')
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
