import Camera from 'webglue/camera';
import Container from 'webglue/container';

import PointLightMesh from '../pointLightMesh';
import SkyBox from '../skyBox';

import TextureCube from 'webglue/textureCube';
import Texture2D from 'webglue/texture2D';
import PhongMaterial from '../phongMaterial';
import BoxGeometry from '../channelBoxGeometry';
import Mesh from 'webglue/mesh';

import UVSphereGeometry from 'webglue/uvSphereGeometry';

import { quat } from 'gl-matrix';

// A normal map testing scene.

export default function createScene() {
  let container = new Container();

  let camera = new Camera();
  container.appendChild(camera);

  quat.rotateX(camera.transform.rotation, camera.transform.rotation,
    -Math.PI / 4);
  camera.transform.invalidate();

  let pointLight = new PointLightMesh({
    color: new Float32Array([1, 1, 1]),
    ambient: 1,
    diffuse: 1,
    specular: 0.8,
    attenuation: 0.0008
  });
  container.appendChild(pointLight);
  pointLight.transform.position[0] = 5;
  pointLight.transform.position[1] = 3;
  pointLight.transform.position[2] = 3;
  pointLight.transform.invalidate();


  let boxGeom = new BoxGeometry();
  let material = new PhongMaterial({
    normalMap: Texture2D.fromImage(require('../texture/crate-normal.png')),
    heightMap: Texture2D.fromImage(require('../texture/crate-height.png')),
    heightMapScale: 0.1,
    heightMapDecay: 1.5,
    diffuseMap: Texture2D.fromImage(require('../texture/crate.jpg')),
    specular: new Float32Array([0.2, 0.2, 0.2]),
    diffuse: new Float32Array([1, 1, 1]),
    ambient: new Float32Array([0.2, 0.2, 0.2]),
    shininess: 10.0
  });

  let mesh = new Mesh(boxGeom, material);
  container.appendChild(mesh);

  let material2 = new PhongMaterial({
    specular: new Float32Array([0.5, 0.5, 0.5]),
    diffuse: new Float32Array([1.0, 1.0, 1.0]),
    ambient: new Float32Array([0.1, 0.1, 0.1]),
    shininess: 32.0
  });

  let mesh2 = new Mesh(boxGeom, material2);
  container.appendChild(mesh2);
  mesh2.transform.position[0] = 3;
  mesh2.transform.invalidate();

  let skybox = new SkyBox(TextureCube.fromImage([
    require('../texture/stormyday/front.jpg'),
    require('../texture/stormyday/back.jpg'),
    require('../texture/stormyday/up.jpg'),
    require('../texture/stormyday/down.jpg'),
    require('../texture/stormyday/right.jpg'),
    require('../texture/stormyday/left.jpg')
  ]));
  container.appendChild(skybox);

  let sphereGeom = new UVSphereGeometry(32, 16);
  let material3 = new PhongMaterial({
    diffuseMap: Texture2D.fromImage(require('../texture/earth.jpg')),
    specular: new Float32Array([0.2, 0.2, 0.2]),
    diffuse: new Float32Array([1, 1, 1]),
    ambient: new Float32Array([0.2, 0.2, 0.2]),
    shininess: 10.0
  });

  let mesh4 = new Mesh(sphereGeom, material3);
  container.appendChild(mesh4);
  mesh4.transform.position[0] = -3;
  // vec3.set(mesh4.transform.scale, 10, 10, 10);
  mesh4.transform.invalidate();


  return {
    container, camera, update: () => {
    }
  };
}
