import Shader from 'webglue/shader';
import Material from 'webglue/material';

import Mesh from 'webglue/mesh';
import Camera from 'webglue/camera';
import Container from 'webglue/container';

import LineGeometry from '../lineGeometry';
import ConeGeometry from 'webglue/coneGeometry';
import CombinedGeometry from 'webglue/combinedGeometry';

import { quat } from 'gl-matrix';

export default function createScene() {
  let container = new Container();

  let camera = new Camera();
  container.appendChild(camera);

  quat.rotateX(camera.transform.rotation, camera.transform.rotation,
    -Math.PI / 4);
  camera.transform.invalidate();

  let lineGeom = new LineGeometry();
  let coneGeom = new ConeGeometry(10);

  let geom = new CombinedGeometry([
    lineGeom, coneGeom
  ], [{}, {
    aPosition: [
      0, 0, 0.05, 0,
      0.1, 0, 0, 0,
      0, 0.05, 0, 0,
      0.9, 0, 0, 1
    ]
  }]);

  let shader = new Shader(
    require('../shader/line.vert'), require('../shader/line.frag')
  );
  let xMat = new Material(shader);
  xMat.use = () => ({
    uColor: new Float32Array([1.0, 0.0, 0.0])
  });
  let yMat = new Material(shader);
  yMat.use = () => ({
    uColor: new Float32Array([0.0, 1.0, 0.0])
  });
  let zMat = new Material(shader);
  zMat.use = () => ({
    uColor: new Float32Array([0.0, 0.0, 1.0])
  });

  let mesh = new Mesh(geom, xMat);
  container.appendChild(mesh);

  let mesh2 = new Mesh(geom, yMat);
  container.appendChild(mesh2);

  quat.rotateZ(mesh2.transform.rotation, mesh2.transform.rotation, Math.PI / 2);
  mesh2.transform.invalidate();

  let mesh3 = new Mesh(geom, zMat);
  container.appendChild(mesh3);

  quat.rotateY(mesh3.transform.rotation, mesh3.transform.rotation,
    -Math.PI / 2);
  mesh3.transform.invalidate();

  return {
    container, camera, update: () => {
    }
  };
}
