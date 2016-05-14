import Camera from 'webglue/camera';
import Container from 'webglue/container';

import {
  TranslateWidget, ScaleWidget, RotationWidget
} from '../widget';

import { quat } from 'gl-matrix';

export default function createScene() {
  let container = new Container();

  let camera = new Camera();
  container.appendChild(camera);

  quat.rotateX(camera.transform.rotation, camera.transform.rotation,
    -Math.PI / 4);
  camera.transform.invalidate();

  let translateWidget = new TranslateWidget();
  translateWidget.transform.position[0] = -2;
  translateWidget.transform.invalidate();

  let rotationWidget = new RotationWidget();

  let scaleWidget = new ScaleWidget();
  scaleWidget.transform.position[0] = 2;
  scaleWidget.transform.invalidate();

  container.appendChild(translateWidget);
  container.appendChild(rotationWidget);
  container.appendChild(scaleWidget);

  return {
    container, camera, update: () => {
    }
  };
}
