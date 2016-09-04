import Renderer from 'webglue/renderer';
import helloScene from './scene/hello';

document.body.style.margin = 0;
document.body.style.padding = 0;
document.body.style.overflow = 'hidden';

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
