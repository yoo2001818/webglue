import PointGeometry from '../../geom/point';
import LineGeometry from '../../geom/line';
import Shader from '../../../shader';
import Material from '../../../material';
import Mesh from '../../../mesh';
import Container from '../../../container';
import CircleGeometry from '../../geom/circle';
import CombinedGeometry from '../../../geom/combinedGeometry';

import { vec3, vec4, quat, mat4 } from 'gl-matrix';

const pointGeom = new PointGeometry();
const pointShader = new Shader(
  require('../../shader/pointLight.vert'),
  require('../../shader/pointLight.frag')
);
const pointMaterial = new Material(pointShader);
pointMaterial.use = () => ({
  uColor: new Float32Array([0, 0, 0]),
  uWidth: 1/25,
  uFill: 6/25,
  uLine1: 18/25,
  uLine2: 25/25,
  uRadius: 25
});

const lineGeom = new LineGeometry();
const circleGeom = new CircleGeometry(32);
const guideLineShader = new Shader(
  require('../../shader/line.vert'),
  require('../../shader/line.frag')
);
const guideLineMaterial = new Material(guideLineShader);
guideLineMaterial.use = () => ({
  uColor: new Float32Array([0.15, 0.15, 0.15])
});

const lineShader = new Shader(
  require('../../shader/dottedBillboardLine.vert'),
  require('../../shader/dottedLine.frag')
);
const lineMaterial = new Material(lineShader);
lineMaterial.use = () => ({
  uColor: new Float32Array([0, 0, 0]),
  uDotted: 0.2
});

export default class SpotLightMesh extends Container {
  constructor(light) {
    super();
    let options = light.options;
    this.light = light;
    this.appendChild(light);
    this.appendChild(new Mesh(pointGeom, pointMaterial));
    this.guideLine = new Mesh(lineGeom, guideLineMaterial);
    this.appendChild(this.guideLine);
    let geom = new CombinedGeometry([
      lineGeom, lineGeom, lineGeom, circleGeom, circleGeom
    ], [
      { aPosition: [20, 0, 0, 0, 1, 0, 0, 0, 1] },
      { aPosition: [20, Math.sin(options.angleStart) * 20, 0,
        0, 1, 0, 0, 0, 1]},
      { aPosition: [20, -Math.sin(options.angleStart) * 20, 0,
        0, 1, 0, 0, 0, 1]},
      { aPosition: [
        0, 0, Math.sin(options.angleStart) * 20, 0,
        0, Math.sin(options.angleStart) * 20, 0, 0,
        0, 0, 0, 0,
        20, 0, 0, 1]},
      { aPosition: [
        0, 0, Math.sin(options.angleEnd) * 20, 0,
        0, Math.sin(options.angleEnd) * 20, 0, 0,
        0, 0, 0, 0,
        20, 0, 0, 1]}
    ]);
    this.line = new Mesh(geom, lineMaterial);
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
