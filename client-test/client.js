import Renderer from 'webglue/renderer';
import helloScene from './scene/hello';

let canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 800;
canvas.height = 600;
let gl = canvas.getContext('webgl', { antialias: false }) ||
  canvas.getContext('experimental-webgl');
let renderer = new Renderer(gl);

let update = helloScene(renderer);

let prevTime = -1;
let timer = 0;

function animate(time) {
  if (prevTime === -1) prevTime = time;
  let delta = time - prevTime;
  prevTime = time;
  timer += delta / 1000;
  update(delta);
  window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
