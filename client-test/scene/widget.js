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

  let widgetGeom = new CombinedGeometry([
    geom, geom, geom
  ], [{
    aColor: [1, 0, 0]
  }, {
    aPosition: [
      0, 1, 0, 0,
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 0, 0, 1
    ],
    aColor: [0, 1, 0]
  }, {
    aPosition: [
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 1
    ],
    aColor: [0, 0, 1]
  }]);

  let shader = new Shader(
    require('../shader/widget.vert'), require('../shader/widget.frag')
  );
  let material = new Material(shader);

  let mesh = new Mesh(widgetGeom, material);
  container.appendChild(mesh);
  
  return {
    container, camera, update: () => {
    }
  };
}
