import Shader from 'webglue/shader';
import PhongMaterial from './phongMaterial';
import Material from 'webglue/material';
import Texture2D from 'webglue/texture2D';
import BoxGeometry from 'webglue/boxGeometry';
import ConeGeometry from 'webglue/coneGeometry';
import UVSphereGeometry from 'webglue/uvSphereGeometry';
import CombinedGeometry from 'webglue/combinedGeometry';
import WireframeGeometry from 'webglue/wireframeGeometry';
import PointGeometry from './pointGeometry';
import Mesh from 'webglue/mesh';
import Camera from 'webglue/camera';
import Container from 'webglue/container';
import AmbientLight from 'webglue/light/ambient';
import DirectionalLightMesh from './directionalLightMesh';
import PointLightMesh from './pointLightMesh';
import SpotLightMesh from './spotLightMesh';
import RenderContext from 'webglue/webgl/renderContext';
import Grid from './grid';
import BlenderCameraController from './blenderCameraController';

import { quat, mat4 } from 'gl-matrix';

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

let wireShader = new Shader(
  require('./shader/wireframe.vert'), require('./shader/wireframe.frag')
);

let wireMaterial = new Material(wireShader);
wireMaterial.use = () => ({
  uColor: new Float32Array([0, 0, 0])
});

const wireGeometries = {};

let inWireframe = false;

function createMaterial(image) {
  let texture = Texture2D.fromImage(image);
  let material = new PhongMaterial({
    uTexture: texture,
    uMaterial: {
      specular: new Float32Array([0.8, 0.8, 0.8]),
      diffuse: new Float32Array([158 / 255, 158 / 255, 166 / 255]),
      ambient: new Float32Array([88 / 255, 88 / 255, 88 / 255]),
      shininess: 51.0
    }
  });
  return material;
}

let sphereGeometry = new UVSphereGeometry(32, 16);
let coneGeometry = new ConeGeometry(16);
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

let mesh4 = new Mesh(sphereGeometry,
  createMaterial(require('./texture/2.png')));
container.appendChild(mesh4);

mesh4.transform.position[0] = 2;
mesh4.transform.scale[0] = 1.5;
mesh4.transform.scale[1] = 1.5;
mesh4.transform.scale[2] = 1.5;
mesh4.transform.invalidate();

let mesh5 = new Mesh(coneGeometry,
  createMaterial(require('./texture/1.jpg')));
container.appendChild(mesh5);

mesh5.transform.position[0] = 4;
mesh5.transform.position[2] = 2;
mesh5.transform.invalidate();

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

let ambientLight = new AmbientLight({
  color: new Float32Array([1, 1, 1]),
  ambient: 0.1
});
container.appendChild(ambientLight);

let directionalLight = new DirectionalLightMesh({
  color: new Float32Array([1, 1, 0.5]),
  ambient: 0.1,
  diffuse: 1,
  specular: 0.8
});
container.appendChild(directionalLight);

directionalLight.transform.position[1] = 4;
directionalLight.transform.position[2] = 8;
quat.rotateY(directionalLight.transform.rotation,
  directionalLight.transform.rotation, Math.PI / 2);
directionalLight.transform.invalidate();

let spotLight = new SpotLightMesh({
  color: new Float32Array([0.2, 0.2, 1]),
  ambient: 0.1,
  diffuse: 1,
  specular: 0.8,
  attenuation: 0.001,
  angleStart: 12.5 / 180 * Math.PI,
  angleEnd: 17.5 / 180 * Math.PI
});
container.appendChild(spotLight);

spotLight.transform.position[1] = 5.5;
spotLight.transform.position[2] = -8;
quat.rotateX(spotLight.transform.rotation,
  spotLight.transform.rotation, Math.PI / 4);
quat.rotateY(spotLight.transform.rotation,
  spotLight.transform.rotation, -Math.PI / 2);
spotLight.transform.invalidate();

let pointLight = new PointLightMesh({
  color: new Float32Array([1, 1, 1]),
  ambient: 0.2,
  diffuse: 1,
  specular: 0.8,
  attenuation: 0.001
});
container.appendChild(pointLight);

pointLight.transform.position[0] = -5;
pointLight.transform.position[1] = 8;
pointLight.transform.position[2] = 5;
pointLight.transform.invalidate();

let pointLight2 = new PointLightMesh({
  color: new Float32Array([1, 0, 0]),
  ambient: 0.2,
  diffuse: 1,
  specular: 0.8,
  attenuation: 0.01
});
container.appendChild(pointLight2);

pointLight2.transform.position[0] = 5;
pointLight2.transform.position[1] = 3;
pointLight2.transform.invalidate();

let controller = new BlenderCameraController(window, camera);
controller.registerEvents();

let context = new RenderContext(gl);

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
  controller.update();
  context.reset();
  container.update(context, null);
  context.render();
}

function animate() {
  render();
  window.requestAnimationFrame(animate);
}
window.requestAnimationFrame(animate);

window.addEventListener('keydown', (e) => {
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
