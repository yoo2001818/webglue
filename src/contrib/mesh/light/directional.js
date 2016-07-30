import PointGeometry from '../../geom/point';
import LineGeometry from '../../geom/line';
import Shader from '../../../shader';
import Material from '../../../material';
import Mesh from '../../../mesh';
import Container from '../../../container';

import { vec3, vec4, quat, mat4 } from 'gl-matrix';

const pointGeom = new PointGeometry();
const pointShader = new Shader(
  require('../../shader/pointLight.vert'),
  require('../../shader/directionalLight.frag')
);
const pointMaterial = new Material(pointShader);
pointMaterial.use = () => ({
  uColor: new Float32Array([0, 0, 0]),
  uWidth: 1/40,
  uFill: 6/40,
  uLine: 18/40,
  uCrossStart: 22/40,
  uRadius: 40
});

const lineGeom = new LineGeometry();
const guideLineShader = new Shader(
  require('../../shader/line.vert'), require('../../shader/line.frag')
);
const guideLineMaterial = new Material(guideLineShader);
guideLineMaterial.use = () => ({
  uColor: new Float32Array([0.15, 0.15, 0.15])
});

const lineShader = new Shader(
  require('../../shader/dottedLine.vert'),
  require('../../shader/dottedLine.frag')
);
const lineMaterial = new Material(lineShader);
lineMaterial.use = () => ({
  uColor: new Float32Array([0, 0, 0]),
  uDotted: 0.2
});

export default class DirectionalLightMesh extends Container {
  constructor(light) {
    super();
    this.light = light;
    this.appendChild(light);
    this.appendChild(new Mesh(pointGeom, pointMaterial));
    this.guideLine = new Mesh(lineGeom, guideLineMaterial);
    this.appendChild(this.guideLine);
    this.line = new Mesh(lineGeom, lineMaterial);
    this.line.transform.scale[0] = 20;
    this.line.transform.invalidate();
    this.appendChild(this.line);
  }
  update(context, parent) {
    super.update(context, parent);
    if (this.hasChanged) {
      // The line should point the ground...
      let center = vec3.create();
      vec3.transformMat4(center, center, this.globalMatrix);
      let point = vec3.create();
      vec3.copy(point, center);
      point[1] = 0;
      // Scale the line to match the size
      this.guideLine.transform.scale[0] = center[1];
      // Here comes the hard part... setting rotation.
      let hand = vec4.fromValues(0, -1, 0, 0);
      let inv = mat4.create();
      mat4.invert(inv, this.globalMatrix);
      vec4.transformMat4(hand, hand, inv);
      vec4.normalize(hand, hand);
      quat.rotationTo(this.guideLine.transform.rotation, [1, 0, 0], hand);
      this.guideLine.transform.invalidate();
    }
  }
}
