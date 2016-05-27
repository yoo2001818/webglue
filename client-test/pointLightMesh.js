import PointGeometry from './pointGeometry';
import LineGeometry from './lineGeometry';
import Shader from 'webglue/shader';
import Material from 'webglue/material';
import Mesh from 'webglue/mesh';
import Container from 'webglue/container';

import { vec3, vec4, quat, mat4 } from 'gl-matrix';

const pointGeom = new PointGeometry();
const pointShader = new Shader(
  require('./shader/pointLight.vert'), require('./shader/pointLight.frag')
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
const lineShader = new Shader(
  require('./shader/line.vert'), require('./shader/line.frag')
);
const lineMaterial = new Material(lineShader);
lineMaterial.use = () => ({
  uColor: new Float32Array([0.15, 0.15, 0.15])
});

export default class PointLightMesh extends Container {
  constructor(light) {
    super();
    this.light = light;
    this.appendChild(light);
    this.appendChild(new Mesh(pointGeom, pointMaterial));
    this.guideLine = new Mesh(lineGeom, lineMaterial);
    this.appendChild(this.guideLine);
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
