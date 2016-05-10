import Shader from 'webglue/shader';
import Material from 'webglue/material';
import WireframeGeometry from 'webglue/wireframeGeometry';
import Mesh from 'webglue/mesh';
import CanvasRenderContext from './canvasRenderContext';
import Grid from './grid';
import sandboxScene from './scene/sandbox';
import BlenderCameraController from './blenderCameraController';

import { quat } from 'gl-matrix';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

let wireShader = new Shader(
  require('./shader/wireframe.vert'), require('./shader/wireframe.frag')
);

let wireMaterial = new Material(wireShader);
wireMaterial.use = () => ({
  uColor: new Float32Array([0, 0, 0])
});

const wireGeometries = {};

let inWireframe = false;

const { container, camera, update: sceneUpdate } = sandboxScene();

let grid = new Grid();
container.appendChild(grid);

quat.rotateX(grid.transform.rotation, grid.transform.rotation, Math.PI / 2);
grid.transform.invalidate();

let controller = new BlenderCameraController(window, camera);
controller.registerEvents();

let context = new CanvasRenderContext();

function render() {
  sceneUpdate();
  controller.update();
  context.update(container);
}

function animate() {
  render();
  window.requestAnimationFrame(animate);
}
window.requestAnimationFrame(animate);

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
