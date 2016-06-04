import Geometry3D from 'webglue/geometry3D';
import Shader from 'webglue/shader';
import Material from 'webglue/material';
import Mesh from 'webglue/mesh';

import { vec3 } from 'gl-matrix';

const coneGeom = new Geometry3D();
coneGeom.vertices = new Float32Array([
  0, 0, 0,
  1, -1, -1,
  1, 1, -1,
  1, 1, 1,
  1, -1, 1,
  1, 1.1, 0.8,
  1, 1.1, -0.8,
  1, 1.5, 0
]);
coneGeom.indices = new Uint8Array([
  0, 1, 0, 2, 0, 3, 0, 4,
  1, 2, 2, 3, 3, 4, 4, 1,
  5, 6, 6, 7, 7, 5
]);
coneGeom.type = 'lines';

const lineShader = new Shader(
  require('./shader/line.vert'), require('./shader/line.frag')
);
const lineMaterial = new Material(lineShader);
lineMaterial.use = () => ({
  uColor: new Float32Array([0, 0, 0])
});

export default class CameraMesh extends Mesh {
  constructor(camera) {
    super(coneGeom, lineMaterial);
    this.camera = camera;
  }
  update(context, parent) {
    super.update(context, parent);
    if (this.camera && this.camera.hasChanged) {
      vec3.copy(this.transform.position, this.camera.transform.position);
      if (this.camera.options.type === 'persp') {
        let fl = 1 / Math.tan(this.camera.options.fov / 2);
        /*
        this.transform.scale[0] = this.camera.options.far;
        this.transform.scale[1] = this.camera.options.far / fl;
        this.transform.scale[2] = this.camera.options.far / fl;
        */
        this.transform.scale[0] = fl;
      }
      this.transform.invalidate();
    }
  }
}
