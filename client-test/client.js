import Shader from '../src/shader';
import Material from '../src/material';
import Geometry3D from '../src/geometry3D';
import Mesh from '../src/mesh';
import Camera from '../src/camera';
import Container from '../src/container';

let shader = new Shader(
  require('./shader/test.vert'), require('./shader/test.frag')
);
let material = new Material(shader);

let geometry = new Geometry3D();

let mesh = new Mesh(geometry, material);
let camera = new Camera();
let container = new Container();
container.appendChild(mesh);
container.appendChild(camera);
container.update(null, null);
