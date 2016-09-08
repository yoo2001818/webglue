import Renderer from 'webglue/renderer';
import CameraController from './cameraController';
import { mat4 } from 'gl-matrix';
import './style/index.css';

function requireAll(context) {
  return context.keys().map(context);
}

const SCENES = requireAll(require.context('./scene/', true, /\.js$/));

// Canvas init
let canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;

window.addEventListener('resize', () => {
  canvas.width = document.documentElement.clientWidth;
  canvas.height = document.documentElement.clientHeight;
});

let gl = canvas.getContext('webgl', { antialias: false }) ||
  canvas.getContext('experimental-webgl');
let renderer = new Renderer(gl);

// Create scene
let update;
let currentIndex = 0;
let sceneNodes = [];
function loadScene(index) {
  renderer.reset();
  update = SCENES[index].default(renderer);
  sceneNodes[currentIndex].className = '';
  sceneNodes[index].className = 'selected';
  currentIndex = index;
  window.localStorage.index = index;
}

// Create UI
function loadUI(string) {
  let child = document.createElement('div');
  child.innerHTML = string;
  child = child.firstChild;
  return child;
}
document.body.appendChild(loadUI(require('./ui.html')));

function loadSceneList() {
  let sceneList = document.getElementById('scene-list');
  sceneNodes = SCENES.map((scene, id) => {
    let node = document.createElement('li');
    node.appendChild(document.createTextNode(scene.default.name));
    node.addEventListener('click', () => loadScene(id));
    sceneList.appendChild(node);
    return node;
  });
}
loadSceneList();
loadScene(window.localStorage.index || 0);

let prevTime = -1;
let timer = 0;

// Create controller
let controller = new CameraController(canvas, document);

let projMat = mat4.create();

function animate(time) {
  if (prevTime === -1) prevTime = time;
  let delta = time - prevTime;
  prevTime = time;
  timer += delta / 1000;

  mat4.perspective(projMat, Math.PI / 180 * 70, gl.drawingBufferWidth /
    gl.drawingBufferHeight, 0.1, 200);
  controller.update(delta);

  if (update) {
    update(delta, {
      camera: {
        uProjection: projMat,
        uView: controller.viewMat
      }
    });
  }
  window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
