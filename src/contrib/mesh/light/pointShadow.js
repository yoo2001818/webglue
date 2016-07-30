import PointLightMesh from './point';
import CameraMesh from '../camera';

export default class PointShadowLightMesh extends PointLightMesh {
  constructor(light) {
    super(light);
    this.appendChild(new CameraMesh(light.camera));
  }
}
