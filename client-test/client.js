import Shader from 'webglue/shader';
import Material from 'webglue/material';
import WireframeGeometry from 'webglue/wireframeGeometry';
import Mesh from 'webglue/mesh';
import CanvasRenderContext from './canvasRenderContext';
import Grid from './grid';
import widgetScene from './scene/normalMap';
import BlenderCameraController from './blenderCameraController';

import { quat } from 'gl-matrix';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

const { container, camera, update: sceneUpdate } = widgetScene();

let grid = new Grid();
container.appendChild(grid);

quat.rotateX(grid.transform.rotation, grid.transform.rotation, Math.PI / 2);
grid.transform.invalidate();

let controller = new BlenderCameraController(window, camera);
controller.registerEvents();

let context = new CanvasRenderContext();
context.camera = camera;

let beforeTime;

let metrics = document.createElement('div');
metrics.style.position = 'absolute';
metrics.style.top = 0;
metrics.style.left = 0;
metrics.style.whiteSpace = 'pre';
metrics.style.background = '#fff';
document.body.appendChild(metrics);

let fpsCurrent = 0;
let fpsTotal = 0;
let fpsCount = 0;

function animate(currentTime) {
  if (beforeTime == null) beforeTime = currentTime;
  let delta = (currentTime - beforeTime) / 1000;
  sceneUpdate(delta);
  controller.update(delta);
  context.update(container, delta);
  fpsTotal += 1000 / (currentTime - beforeTime);
  fpsCount ++;
  beforeTime = currentTime;
  if (fpsCount > 30) {
    fpsCurrent = fpsTotal / fpsCount;
    fpsCount = 0;
    fpsTotal = 0;
  }
  let metricData = '';
  metricData += 'webglue v0.1.0\n';
  metricData += 'FPS: ' + fpsCurrent.toFixed(2) + '\n';
  for (let key in context.metrics) {
    metricData += key + ': ' + context.metrics[key] + '\n';
  }
  metrics.innerHTML = metricData;
  window.requestAnimationFrame(animate);
}
window.requestAnimationFrame(animate);

let wireShader = new Shader(
  require('./shader/wireframe.vert'), require('./shader/wireframe.frag')
);

let wireMaterial = new Material(wireShader);
wireMaterial.use = () => ({
  uColor: new Float32Array([0, 0, 0])
});

const wireGeometries = {};

let inWireframe = false;

window.addEventListener('keydown', (e) => {
  if (e.keyCode === 71) {
    grid.visible = !grid.visible;
  }
  if (e.keyCode === 90) {
    // Iterate through all childrens in the container
    container.children.forEach(child => {
      if (!(child instanceof Mesh)) return;
      if (inWireframe) {
        if (child.origMaterial && child.origGeometry) {
          child.material = child.origMaterial;
          child.geometry = child.origGeometry;
        }
      } else {
        if (child.geometry.type === 'points') return;
        if (child.geometry.type === 'lines') return;
        child.origMaterial = child.material;
        child.material = wireMaterial;
        child.origGeometry = child.geometry;
        if (wireGeometries[child.geometry.name] == null) {
          wireGeometries[child.geometry.name] =
            new WireframeGeometry(child.geometry);
        }
        child.geometry = wireGeometries[child.geometry.name];
      }
    });
    inWireframe = !inWireframe;
  }
});
