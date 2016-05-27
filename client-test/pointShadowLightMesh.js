import PointLightMesh from './pointLightMesh';
import CameraMesh from './cameraMesh';

export default class PointShadowLightMesh extends PointLightMesh {
  constructor(light) {
    super(light);
    this.appendChild(new CameraMesh(light.camera));
  }
}
