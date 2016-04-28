import Shader from '../src/shader';
import Material from '../src/material';
import Texture2D from '../src/texture2D';
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

let cWidth, cHeight;
function validateSize() {
  const { clientWidth: width, clientHeight: height } = document.documentElement;
  if (cWidth !== width || cHeight !== height) {
    canvas.width = width | 0;
    canvas.height = height | 0;
    cWidth = width;
    cHeight = height;
    handleResize();
  }
}
validateSize();
window.addEventListener('resize', validateSize);

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

function createMaterial(image) {
  let texture = Texture2D.fromImage(image);
  let material = new Material(shader);

  material.use = () => {
    return {
      uTexture: texture
    };
  };
  return material;
}

let geometry = new BoxGeometry();

let mesh = new Mesh(geometry, createMaterial(require('./texture/1.jpg')));
let camera = new Camera();
let container = new Container();
container.appendChild(mesh);
container.appendChild(camera);

camera.aspect = canvas.width / canvas.height;
//camera.transform.position[2] = 3;
camera.transform.invalidate();

mesh.transform.position[2] = -3;
mesh.transform.invalidate();

let mesh2 = new Mesh(geometry, createMaterial(require('./texture/2.png')));
container.appendChild(mesh2);

mesh2.transform.position[1] = -2;
mesh2.transform.position[2] = -3;
mesh2.transform.invalidate();

let mesh3 = new Mesh(geometry, createMaterial(require('./texture/3.jpg')));
container.appendChild(mesh3);

mesh3.transform.position[0] = -2;
mesh3.transform.position[1] = -2;
mesh3.transform.position[2] = -3;
mesh3.transform.invalidate();

let context = new RenderContext(gl);

container.update(context, null);

function handleResize() {
  if (!gl) return;
  gl.viewport(0, 0, canvas.width, canvas.height);
  camera.aspect = canvas.width / canvas.height;
  camera.invalidate();
  render();
}

function render() {
  quat.rotateY(mesh.transform.rotation, mesh.transform.rotation,
      Math.PI / 180 * 2);
  mesh.transform.invalidate();
  /* quat.rotateY(camera.transform.rotation, camera.transform.rotation,
      Math.PI / 180 * 1); */
  vec3.transformQuat(camera.transform.position, [0, 0, radius],
    camera.transform.rotation);
  vec3.add(camera.transform.position, camera.transform.position, cameraCenter);
  camera.transform.invalidate();

  context.reset();
  container.update(context, null);
  context.render();
}

function animate() {
  render();
  window.requestAnimationFrame(animate);
}
window.requestAnimationFrame(animate);

let prevX = 0, prevY = 0, dir = 0;
let cameraCenter = vec3.fromValues(0, -2, -3);
let radius = 6;

function handleMouseMove(e) {
  let offsetX = e.clientX - prevX;
  let offsetY = e.clientY - prevY;
  prevX = e.clientX;
  prevY = e.clientY;
  if (e.shiftKey) {
    // Do translation instead - we'd need two vectors to make translation
    // relative to the camera rotation
    let vecX = vec3.create();
    let vecY = vec3.create();
    vec3.transformQuat(vecX, [-offsetX / 100, 0, 0],
      camera.transform.rotation);
    vec3.transformQuat(vecY, [0, offsetY / 100, 0],
      camera.transform.rotation);
    vec3.add(cameraCenter, cameraCenter, vecX);
    vec3.add(cameraCenter, cameraCenter, vecY);
    camera.transform.invalidate();
    return;
  }
  // Global rotation....
  let rot = quat.create();
  quat.rotateY(rot, rot,
      Math.PI / 180 * -offsetX * dir);
  quat.multiply(camera.transform.rotation, rot, camera.transform.rotation);
  quat.rotateX(camera.transform.rotation, camera.transform.rotation,
      Math.PI / 180 * -offsetY);
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

window.addEventListener('wheel', e => {
  radius += e.deltaY / 5;
});
