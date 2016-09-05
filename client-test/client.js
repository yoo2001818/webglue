import Renderer from 'webglue/renderer';
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
loadScene(0);

let prevTime = -1;
let timer = 0;

function animate(time) {
  if (prevTime === -1) prevTime = time;
  let delta = time - prevTime;
  prevTime = time;
  timer += delta / 1000;
  if (update) update(delta);
  window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
