import Shader from '../src/shader';
import Material from '../src/material';
import BoxGeometry from '../src/boxGeometry';
import Mesh from '../src/mesh';
import Camera from '../src/camera';
import Container from '../src/container';
import RenderContext from '../src/webgl/renderContext';

import { quat, vec3 } from 'gl-matrix';

// Init canvas

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

let canvas = document.createElement('canvas');
document.body.appendChild(canvas);

canvas.width = 640;
canvas.height = 480;

// Init WebGL

let gl;

try {
  gl = canvas.getContext('webgl', { antialias: false }) ||
    canvas.getContext('experimental-webgl');
} catch (e) {
  console.log(e);
}
if (!gl) {
  alert('This browser does not support WebGL.');
  throw new Error('WebGL unsupported');
}

// Set clear color to black, fully opaque
gl.clearColor(57 / 255, 57 / 255, 57 / 255, 1.0);
// Enable depth testing
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
// gl.enable(gl.BLEND);
// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
// Near things obscure far things
gl.depthFunc(gl.LEQUAL);
// Clear the color as well as the depth buffer.
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

let shader = new Shader(
  require('./shader/test.vert'), require('./shader/test.frag')
);
let material = new Material(shader);

let geometry = new BoxGeometry();

let mesh = new Mesh(geometry, material);
let camera = new Camera();
let container = new Container();
container.appendChild(mesh);
container.appendChild(camera);

camera.aspect = 640 / 480;
//camera.transform.position[2] = 3;
camera.transform.invalidate();

mesh.transform.position[2] = -3;
mesh.transform.invalidate();

let mesh2 = new Mesh(geometry, material);
container.appendChild(mesh2);

mesh2.transform.position[1] = -2;
mesh2.transform.position[2] = -3;
mesh2.transform.invalidate();

let context = new RenderContext(gl);

container.update(context, null);

function animate() {
  quat.rotateY(mesh.transform.rotation, mesh.transform.rotation,
      Math.PI / 180 * 2);
  mesh.transform.invalidate();
  /* quat.rotateY(camera.transform.rotation, camera.transform.rotation,
      Math.PI / 180 * 1); */
  vec3.transformQuat(camera.transform.position, [0, 0, 6],
    camera.transform.rotation);
  vec3.add(camera.transform.position, camera.transform.position, [0, -2, -3]);
  camera.transform.invalidate();

  context.reset();
  container.update(context, null);
  context.render();

  window.requestAnimationFrame(animate);
}
window.requestAnimationFrame(animate);

let prevX = 0, prevY = 0, dir = 0;

function handleMouseMove(e) {
  let offsetX = e.clientX - prevX;
  let offsetY = e.clientY - prevY;
  // Global rotation....
  let rot = quat.create();
  quat.rotateY(rot, rot,
      Math.PI / 180 * -offsetX * dir);
  quat.multiply(camera.transform.rotation, rot, camera.transform.rotation);
  quat.rotateX(camera.transform.rotation, camera.transform.rotation,
      Math.PI / 180 * -offsetY);
  prevX = e.clientX;
  prevY = e.clientY;
  //console.log(quat.dot(def, camera.transform.rotation));
  //quat.copy(mesh2.transform.rotation, camera.transform.rotation);
  mesh2.transform.invalidate();
}

window.addEventListener('mousedown', e => {
  // Determine if we should go clockwise or anticlockwise.
  let upLocal = vec3.create();
  let up = vec3.fromValues(0, 1, 0);
  vec3.transformQuat(upLocal, [0, 1, 0],
    camera.transform.rotation);
  let upDot = vec3.dot(up, upLocal);
  dir = upDot > 0 ? 1 : -1;
  // Set position and register event
  prevX = e.clientX;
  prevY = e.clientY;
  window.addEventListener('mousemove', handleMouseMove);
});

window.addEventListener('mouseup', () => {
  window.removeEventListener('mousemove', handleMouseMove);
});
