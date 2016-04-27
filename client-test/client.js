import Shader from '../src/shader';
import Material from '../src/material';
import BoxGeometry from '../src/boxGeometry';
import Mesh from '../src/mesh';
import Camera from '../src/camera';
import Container from '../src/container';
import RenderContext from '../src/webgl/renderContext';

import { quat } from 'gl-matrix';

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
camera.transform.position[2] = 3;
camera.transform.invalidate();

mesh.transform.position[2] = -3;
mesh.transform.invalidate();

let context = new RenderContext(gl);

container.update(context, null);

function animate() {
  context.reset();
  container.update(context, null);
  context.render();

  quat.rotateY(mesh.transform.rotation, mesh.transform.rotation,
      Math.PI / 180 * 2);
  //console.log(mesh.transform.rotation);
  mesh.transform.invalidate();
  window.requestAnimationFrame(animate);
}
window.requestAnimationFrame(animate);
