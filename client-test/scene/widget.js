import Shader from 'webglue/shader';
import Material from 'webglue/material';

import Mesh from 'webglue/mesh';
import Camera from 'webglue/camera';
import Container from 'webglue/container';

import LineGeometry from '../lineGeometry';
import CircleGeometry from '../circleGeometry';
import ConeGeometry from 'webglue/coneGeometry';
import BoxGeometry from 'webglue/boxGeometry';
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
  let boxGeom = new BoxGeometry();
  let circleGeom = new CircleGeometry(24, 0.7);

  let transGeom = new CombinedGeometry([
    lineGeom, coneGeom
  ], [{}, {
    aPosition: [
      0, 0, 0.05, 0,
      0.1, 0, 0, 0,
      0, 0.05, 0, 0,
      0.9, 0, 0, 1
    ]
  }]);

  let scaleGeom = new CombinedGeometry([
    lineGeom, boxGeom
  ], [{}, {
    aPosition: [
      0, 0, 0.05, 0,
      0.05, 0, 0, 0,
      0, 0.05, 0, 0,
      1, 0, 0, 1
    ]
  }]);

  let rotationGeom = new CombinedGeometry([
    circleGeom
  ], [{
    aPosition: [
      0, 1, 0, 0,
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 0, 0, 1
    ]
  }]);

  function buildGeom(geom) {
    return new CombinedGeometry([
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
  }

  let transWidgetGeom = buildGeom(transGeom);
  let scaleWidgetGeom = buildGeom(scaleGeom);
  let rotationWidgetGeom = buildGeom(rotationGeom);

  let shader = new Shader(
    require('../shader/widget.vert'), require('../shader/widget.frag')
  );
  let material = new Material(shader);

  let rotationShader = new Shader(
    require('../shader/widgetRotation.vert'),
    require('../shader/widgetRotation.frag')
  );
  let rotationMaterial = new Material(rotationShader);

  let billboardShader = new Shader(
    require('../shader/widgetBillboard.vert'),
    require('../shader/widget.frag')
  );
  let billboardMaterial = new Material(billboardShader);
  billboardMaterial.use = () => ({
    uColor: new Float32Array([0, 0, 0])
  });

  let mesh = new Mesh(transWidgetGeom, material);
  container.appendChild(mesh);

  let mesh2 = new Mesh(scaleWidgetGeom, material);
  container.appendChild(mesh2);

  mesh2.transform.position[0] = 1;
  mesh2.transform.invalidate();

  let mesh3 = new Mesh(rotationWidgetGeom, rotationMaterial);
  container.appendChild(mesh3);

  mesh3.transform.position[0] = -1;
  mesh3.transform.invalidate();

  let mesh4 = new Mesh(circleGeom, billboardMaterial);
  container.appendChild(mesh4);

  mesh4.transform.position[0] = -1;
  mesh4.transform.invalidate();

  return {
    container, camera, update: () => {
    }
  };
}
