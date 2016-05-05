import Shader from '../src/shader';
// import SolidMaterial from './solidMaterial';
import Material from '../src/material';
import Texture2D from '../src/texture2D';
import BoxGeometry from '../src/boxGeometry';
// import ConeGeometry from '../src/coneGeometry';
// import UVSphereGeometry from '../src/uvSphereGeometry';
import CombinedGeometry from '../src/combinedGeometry';
import WireframeGeometry from '../src/wireframeGeometry';
import PointGeometry from './pointGeometry';
import Mesh from '../src/mesh';
import Camera from '../src/camera';
import Container from '../src/container';
import RenderContext from '../src/webgl/renderContext';
import Grid from './grid';

import { quat, vec3, mat4 } from 'gl-matrix';

// Init canvas

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

let canvas = document.createElement('canvas');
document.body.appendChild(canvas);

/* let statusBar = document.createElement('div');
statusBar.style.color = '#fff';
statusBar.style.position = 'absolute';
statusBar.style.top = '10px';
statusBar.style.left = '18px';
statusBar.style.fontSize = '11px';
document.body.appendChild(statusBar);
statusBar.innerHTML = 'User Persp'; */

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
  require('./shader/solid.vert'), require('./shader/test.frag')
);

let wireShader = new Shader(
  require('./shader/wireframe.vert'), require('./shader/wireframe.frag')
);

let inWireframe = false;

/*let material = new SolidMaterial({
  specular: new Float32Array([0.2, 0.2, 0.2]),
  diffuse: new Float32Array([158 / 255, 158 / 255, 166 / 255]),
  ambient: new Float32Array([88 / 255, 88 / 255, 88 / 255]),
  reflection: new Float32Array([140 / 255, 140 / 255, 170 / 255]),
  shininess: 4.0
});*/

function createMaterial(image) {
  let texture = Texture2D.fromImage(image);
  let material = new Material(shader);
  let options = {
    uTexture: texture,
    uMaterial: {
      specular: new Float32Array([0.2, 0.2, 0.2]),
      diffuse: new Float32Array([158 / 255, 158 / 255, 166 / 255]),
      ambient: new Float32Array([88 / 255, 88 / 255, 88 / 255]),
      reflection: new Float32Array([140 / 255, 140 / 255, 170 / 255]),
      shininess: 4.0,
      threshold: 0.0
    },
    uColor: new Float32Array([0, 0, 0])
  };

  material.use = () => options;
  return material;
}

// let geometry = new UVSphereGeometry(32, 16);
let geometry = new CombinedGeometry([
  new BoxGeometry(),
  new BoxGeometry(),
  new BoxGeometry(),
  new BoxGeometry()
], [
  {
    aPosition: (() => {
      let mat = mat4.create();
      mat4.translate(mat, mat, [0, 2.5, 0]);
      return mat;
    })()
  },
  {
    aPosition: (() => {
      let mat = mat4.create();
      mat4.scale(mat, mat, [0.5, 1.5, 1]);
      return mat;
    })()
  },
  {
    aPosition: (() => {
      let mat = mat4.create();
      mat4.translate(mat, mat, [1, -2.25, 0]);
      mat4.scale(mat, mat, [0.5, 0.75, 1]);
      return mat;
    })()
  },
  {
    aPosition: (() => {
      let mat = mat4.create();
      mat4.translate(mat, mat, [-1, -2.25, 0]);
      mat4.scale(mat, mat, [0.5, 0.75, 1]);
      return mat;
    })()
  }
]);
let wireGeometry = new WireframeGeometry(geometry);

let mesh = new Mesh(geometry, createMaterial(require('./texture/1.jpg')));
let camera = new Camera();
let container = new Container();
container.appendChild(mesh);
container.appendChild(camera);

camera.aspect = canvas.width / canvas.height;
//camera.transform.position[2] = 3;
quat.rotateX(camera.transform.rotation, camera.transform.rotation,
  -Math.PI / 3);
camera.transform.invalidate();

mesh.transform.position[0] = -2;
mesh.transform.invalidate();

let mesh2 = new Mesh(geometry, createMaterial(require('./texture/2.png')));
container.appendChild(mesh2);

mesh2.transform.position[2] = -1 - Math.sqrt(2);
mesh2.transform.invalidate();

let mesh3 = new Mesh(geometry, createMaterial(require('./texture/3.jpg')));
container.appendChild(mesh3);

mesh3.transform.position[0] = -3;
mesh3.transform.position[2] = -1 - Math.sqrt(2);
mesh3.transform.invalidate();

let grid = new Grid();
container.appendChild(grid);

quat.rotateX(grid.transform.rotation, grid.transform.rotation, Math.PI / 2);
grid.transform.invalidate();

let pointGeom = new PointGeometry();
let pointShader = new Shader(
  require('./shader/anchorPoint.vert'), require('./shader/anchorPoint.frag')
);
let pointMaterial = new Material(pointShader);
pointMaterial.use = () => ({
  uCross: new Float32Array([0, 0, 0]),
  uBorder1: new Float32Array([1, 0, 0]),
  uBorder2: new Float32Array([1, 1, 1]),
  uCrossWidth: 1/40,
  uCrossSize: 40,
  uCrossStart: 10/40,
  uRadius: 20/40,
  uBorderWidth: 1/40
});
let centerPoint = new Mesh(pointGeom, pointMaterial);
container.appendChild(centerPoint);

let context = new RenderContext(gl);

container.update(context, null);

function handleResize() {
  if (!gl) return;
  gl.viewport(0, 0, canvas.width, canvas.height);
  camera.aspect = canvas.width / canvas.height;
  camera.invalidate();
  render();
}

function easeInOutQuad (t) {
  t *= 2;
  if (t < 1) return t*t/2;
  t--;
  return (t*(t-2) - 1) / -2;
}

function render() {
  quat.rotateY(mesh.transform.rotation, mesh.transform.rotation,
      Math.PI / 180 * 2);
  mesh.transform.invalidate();
  /* quat.rotateY(camera.transform.rotation, camera.transform.rotation,
      Math.PI / 180 * 1); */
  if (lerpCounter !== -1) {
    quat.slerp(camera.transform.rotation,
      lerpStart, lerpEnd, easeInOutQuad(lerpCounter / 15)
    );
    lerpCounter ++;

    if (lerpCounter > 15) lerpCounter = -1;
  }
  if (camera.type === 'ortho') {
    camera.zoom = radius;
    camera.invalidate();
    vec3.transformQuat(camera.transform.position, [0, 0, radius],
      camera.transform.rotation);
    vec3.add(camera.transform.position, camera.transform.position,
      cameraCenter);
    camera.transform.invalidate();
  } else {
    vec3.transformQuat(camera.transform.position, [0, 0, radius],
      camera.transform.rotation);
    vec3.add(camera.transform.position, camera.transform.position,
      cameraCenter);
    camera.transform.invalidate();
  }

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
let cameraCenter = vec3.fromValues(0, 0, 0);
let radius = 6;

let lerpStart = quat.create();
let lerpEnd = quat.create();
let lerpCounter = -1;

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
    vec3.transformQuat(vecX, [-offsetX * radius / 600, 0, 0],
      camera.transform.rotation);
    vec3.transformQuat(vecY, [0, offsetY * radius / 600, 0],
      camera.transform.rotation);
    vec3.add(cameraCenter, cameraCenter, vecX);
    vec3.add(cameraCenter, cameraCenter, vecY);
    camera.transform.invalidate();
    vec3.copy(centerPoint.transform.position, cameraCenter);
    centerPoint.transform.invalidate();
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
  dir = upDot >= 0 ? 1 : -1;
  // Set position and register event
  prevX = e.clientX;
  prevY = e.clientY;
  window.addEventListener('mousemove', handleMouseMove);
});

window.addEventListener('mouseup', () => {
  window.removeEventListener('mousemove', handleMouseMove);
});

window.addEventListener('keydown', (e) => {
  if (e.shiftKey) return;
  // Screw legacy browser compatability.
  if (e.keyCode === 90) {
    if (inWireframe) {
      mesh.material.shader = shader;
      mesh2.material.shader = shader;
      mesh3.material.shader = shader;
      mesh.geometry = geometry;
      mesh2.geometry = geometry;
      mesh3.geometry = geometry;
      inWireframe = false;
    } else {
      mesh.material.shader = wireShader;
      mesh2.material.shader = wireShader;
      mesh3.material.shader = wireShader;
      mesh.geometry = wireGeometry;
      mesh2.geometry = wireGeometry;
      mesh3.geometry = wireGeometry;
      inWireframe = true;
    }
  }
  if (e.keyCode === 101 || e.keyCode === 53) {
    if (camera.type === 'persp') {
      camera.type = 'ortho';
      camera.near = -100;
      //camera.far = 100;
      // statusBar.innerHTML = 'User Ortho';
    } else {
      camera.type = 'persp';
      camera.near = 0.3;
      //camera.far = 1000;
      // statusBar.innerHTML = 'User Persp';
    }
    camera.invalidate();
  }
  if (e.keyCode === 97 || e.keyCode === 49) {
    quat.copy(lerpStart, camera.transform.rotation);
    quat.identity(lerpEnd);
    if (e.ctrlKey) {
      quat.rotateY(lerpEnd, lerpEnd, Math.PI);
    }
    lerpCounter = 0;
  }
  if (e.keyCode === 99 || e.keyCode === 51) {
    quat.copy(lerpStart, camera.transform.rotation);
    quat.identity(lerpEnd);
    quat.rotateY(lerpEnd, lerpEnd, Math.PI / 2);
    if (e.ctrlKey) {
      quat.rotateY(lerpEnd, lerpEnd, -Math.PI);
    }
    lerpCounter = 0;
  }
  if (e.keyCode === 103 || e.keyCode === 55) {
    quat.copy(lerpStart, camera.transform.rotation);
    quat.identity(lerpEnd);
    quat.rotateX(lerpEnd, lerpEnd, -Math.PI / 2);
    if (e.ctrlKey) {
      quat.rotateX(lerpEnd, lerpEnd, Math.PI);
    }
    lerpCounter = 0;
  }
});

window.addEventListener('wheel', e => {
  radius += e.deltaY / 5;
});
