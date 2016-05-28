import Shader from 'webglue/shader';
import Material from 'webglue/material';
import WireframeGeometry from 'webglue/wireframeGeometry';

import UniQuadGeometry from 'webglue/uniQuadGeometry';
import Framebuffer from 'webglue/framebuffer';
import Texture from 'webglue/texture';
import Renderbuffer from 'webglue/renderbuffer';
import Scene from 'webglue/scene';
import Camera from 'webglue/camera';

import Mesh from 'webglue/mesh';
import CanvasRenderContext from './canvasRenderContext';
import Grid from './grid';
import widgetScene from './scene/normalMap';
import FPSCameraController from './fpsCameraController';

import PointGeometry from './pointGeometry';
import { TranslateWidget } from './widget';

import { quat, vec3, mat4 } from 'gl-matrix';
import geometryRayIntersection from './util/geometryRayIntersection';

import RenderTask from 'webglue/renderTask';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

const { container, camera, update: sceneUpdate } = widgetScene();

let grid = new Grid();
container.appendChild(grid);

quat.rotateX(grid.transform.rotation, grid.transform.rotation, Math.PI / 2);
grid.transform.invalidate();

let pointGeom = new PointGeometry();
let anchorShader = new Shader(
  require('./shader/anchorPoint.vert'), require('./shader/anchorPoint.frag')
);
let anchorMat = new Material(anchorShader);
anchorMat.use = () => ({
  uCross: new Float32Array([0, 0, 0]),
  uBorder1: new Float32Array([1, 0, 0]),
  uBorder2: new Float32Array([1, 1, 1]),
  uCrossWidth: 1/40,
  uCrossSize: 40,
  uCrossStart: 10/40,
  uRadius: 20/40,
  uBorderWidth: 1/40
});
let anchor = new Mesh(pointGeom, anchorMat);
container.appendChild(anchor);

let translateWidget = new TranslateWidget();
container.appendChild(translateWidget);

let context = new CanvasRenderContext();
context.mainScene.camera = camera;

let controller = new FPSCameraController(context.canvas, window, camera);
controller.registerEvents();

// Build post-processing scene
let outTexture = new Texture(null, 'rgb', 'uint8', {
  minFilter: 'nearest',
  magFilter: 'nearest',
  wrapS: 'clamp',
  wrapT: 'clamp',
  mipmap: false
});

let postProcess = new Scene();
let uniQuad = new UniQuadGeometry();

let postShader = new Shader(
  require('./shader/invert.vert'), require('./shader/border.frag')
);
let postMat = new Material(postShader);
postMat.getShader = () => postMat.shader;
postMat.use = () => ({
  uTexture: outTexture,
  uTextureOffset: () => new Float32Array(
    [1 / context.width, 1 / context.height])
});

// TODO Implement availability to set null instead
postProcess.camera = camera;

let postMesh = new Mesh(uniQuad, postMat);
postMesh.update(postProcess);

let normalShader = new Shader(
  require('./shader/normal.vert'), require('./shader/normal.frag')
);
let normalMat = new Material(normalShader);
normalMat.getShader = () => normalMat.shader;

context.tasks = [
  new RenderTask(context.mainScene, 'default')
];

let selectedMesh = null;

context.canvas.addEventListener('click', e => {
  if (e.button !== 0) return;
  const canvas = context.canvas;
  // Convert mouse position to NDC
  let x = (e.clientX - canvas.width / 2) / (canvas.width / 2);
  let y = -(e.clientY - canvas.height / 2) / (canvas.height / 2);

  function calcWorld(ndc) {
    // Invert projection matrix
    let projInverse = mat4.create();
    mat4.invert(projInverse, camera.projectMatrix);

    let viewPos = vec3.create();
    vec3.transformMat4(viewPos, ndc, projInverse);

    // Apply inverse view matrix
    let worldPos = vec3.create();
    vec3.transformMat4(worldPos, viewPos, camera.globalMatrix);
    return worldPos;
  }

  let far = calcWorld(vec3.fromValues(x, y, 1.0));
  let near = calcWorld(vec3.fromValues(x, y, -1.0));

  let diff = vec3.create();
  vec3.subtract(diff, far, near);
  vec3.normalize(diff, diff);

  let minMesh = null;
  // let minFace = null;
  let minDist = Infinity;

  // Perform ray cast to all the meshes
  container.children.forEach(child => {
    if (!(child instanceof Mesh)) return;
    // Global matrix must be updated prior to the collision event
    let collision = geometryRayIntersection(child.geometry, child.globalMatrix,
      near, diff);
    if (collision === null) return;
    if (minDist > collision.distance) {
      minMesh = child;
      // minFace = collision.faceId;
      minDist = collision.distance;
    }
  });

  if (minDist !== Infinity) {
    vec3.copy(anchor.transform.position, near);
    let delta = vec3.create();
    vec3.copy(delta, diff);
    vec3.scale(delta, diff, minDist);
    vec3.add(anchor.transform.position, anchor.transform.position, delta);
    anchor.transform.invalidate();
  } else {
    // Calculate depth of anchor projected to the camera.
    let original = vec3.create();
    vec3.transformMat4(original, anchor.transform.position, camera.pvMatrix);
    let out = calcWorld(vec3.fromValues(x, y, original[2]));
    vec3.copy(anchor.transform.position, out);
    anchor.transform.invalidate();
  }

  if (minMesh) {
    selectedMesh = minMesh;
  }
});

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

  if (selectedMesh) {
    vec3.copy(translateWidget.transform.position,
      selectedMesh.transform.position);
    translateWidget.transform.invalidate();
  }

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
