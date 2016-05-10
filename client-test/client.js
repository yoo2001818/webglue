import Shader from 'webglue/shader';
import PhongMaterial from './phongMaterial';
import Material from 'webglue/material';
import Texture2D from 'webglue/texture2D';
import BoxGeometry from 'webglue/boxGeometry';
import QuadGeometry from 'webglue/quadGeometry';
// import UVSphereGeometry from 'webglue/uvSphereGeometry';
import WireframeGeometry from 'webglue/wireframeGeometry';
import Mesh from 'webglue/mesh';
import Camera from 'webglue/camera';
import Container from 'webglue/container';
// import AmbientLight from 'webglue/light/ambient';
// import DirectionalLightMesh from './directionalLightMesh';
import PointLightMesh from './pointLightMesh';
// import SpotLightMesh from './spotLightMesh';
import RenderContext from 'webglue/webgl/renderContext';
import Grid from './grid';
import BlenderCameraController from './blenderCameraController';

import { quat } from 'gl-matrix';

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
      specular: new Float32Array([0.2, 0.2, 0.2]),
      diffuse: new Float32Array([1, 1, 1]),
      ambient: new Float32Array([0.5, 0.5, 0.5]),
      shininess: 10.0
    }
  });
  return material;
}

let geometry = new BoxGeometry();
let quadGeom = new QuadGeometry();

let container = new Container();

let camera = new Camera();
container.appendChild(camera);

camera.aspect = canvas.width / canvas.height;
//camera.transform.position[2] = 3;
quat.rotateY(camera.transform.rotation, camera.transform.rotation,
  Math.PI / 4);
quat.rotateX(camera.transform.rotation, camera.transform.rotation,
  -Math.PI / 3);
camera.transform.invalidate();

let mesh = new Mesh(geometry, createMaterial(require('./texture/wood.jpg')));
container.appendChild(mesh);

let mesh2 = new Mesh(quadGeom, createMaterial(require('./texture/sand.jpg')));
container.appendChild(mesh2);
mesh2.transform.position[1] = -1;
mesh2.transform.scale[0] = 5;
mesh2.transform.scale[2] = 5;
mesh2.transform.invalidate();

let mesh3 = new Mesh(quadGeom, createMaterial(require('./texture/brick.jpg')));
container.appendChild(mesh3);
quat.rotateX(mesh3.transform.rotation, mesh3.transform.rotation,
  -Math.PI / 2);
quat.rotateZ(mesh3.transform.rotation, mesh3.transform.rotation,
  Math.PI);
mesh3.transform.position[2] = -5;
mesh3.transform.scale[0] = 5;
mesh3.transform.scale[2] = 5;
mesh3.transform.invalidate();

let mesh4 = new Mesh(quadGeom, createMaterial(require('./texture/brick.jpg')));
container.appendChild(mesh4);
quat.rotateX(mesh4.transform.rotation, mesh4.transform.rotation,
  -Math.PI / 2);
quat.rotateZ(mesh4.transform.rotation, mesh4.transform.rotation,
  -Math.PI / 2);
mesh4.transform.position[0] = -5;
mesh4.transform.scale[0] = 5;
mesh4.transform.scale[2] = 5;
mesh4.transform.invalidate();

let grid = new Grid();
container.appendChild(grid);

quat.rotateX(grid.transform.rotation, grid.transform.rotation, Math.PI / 2);
grid.transform.invalidate();

let directionalLight = new PointLightMesh({
  color: new Float32Array([1, 1, 1]),
  ambient: 0.1,
  diffuse: 1,
  specular: 0.8,
  attenuation: 0.0008
});
container.appendChild(directionalLight);

directionalLight.transform.position[1] = 10;
directionalLight.transform.position[2] = 8;
directionalLight.transform.position[0] = 8;
quat.rotateY(directionalLight.transform.rotation,
  directionalLight.transform.rotation, Math.PI / 4 * 3);
quat.rotateZ(directionalLight.transform.rotation,
  directionalLight.transform.rotation, -Math.PI / 3);
directionalLight.transform.invalidate();

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
  if (e.keyCode === 71) {
    grid.visible = !grid.visible;
  }
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
