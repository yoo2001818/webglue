import Renderer from 'webglue/renderer';
import Camera from 'webglue/camera';
import CameraController from 'webglue/contrib/blenderController';
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

let gl = canvas.getContext('webgl', { antialias: true }) ||
  canvas.getContext('experimental-webgl');
let renderer = new Renderer(gl);

// Create scene
let scene;
let sceneEvents = [];
let update;
let currentIndex = 0;
let sceneNodes = [];
function loadScene(index) {
  renderer.reset();
  sceneEvents.forEach(({key, listener}) => {
    document.removeEventListener(key, listener);
  });
  scene = SCENES[index].default(renderer);
  if (typeof scene === 'function') {
    update = scene;
  } else {
    update = scene.update;
  }
  for (let key in scene) {
    if (key === 'update') continue;
    let listener = event => {
      // Calculate NDC
      if (event.clientX != null) {
        let ndc = [
          event.clientX / canvas.width * 2 - 1,
          -(event.clientY / canvas.height * 2 - 1)
        ];
        return scene[key](event, ndc);
      }
      return scene[key](event);
    };
    sceneEvents.push({key, listener});
    document.addEventListener(key, listener);
  }
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
let camera = new Camera();
let controller = new CameraController(canvas, document, camera);

function animate(time) {
  if (prevTime === -1) prevTime = time;
  let delta = (time - prevTime) / 1000;
  prevTime = time;
  timer += delta;

  controller.update(delta);

  if (update) {
    update(delta, {
      cameraObj: camera,
      camera: {
        uProjection: camera.getProjection,
        uView: camera.getView,
        uProjectionView: camera.getPV
      }
    });
  }
  window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
