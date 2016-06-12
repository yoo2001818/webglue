import Camera from 'webglue/camera';
import Container from 'webglue/container';

import DirectionalLight from 'webglue/light/directional';
// import DirectionalLightMesh from '../directionalLightMesh';

import Texture2D from 'webglue/texture2D';
import Shader from 'webglue/shader';
import Material from 'webglue/material';
import PhongMaterial from '../phongMaterial';
import UniQuadGeometry from 'webglue/uniQuadGeometry';
import QuadGeometry from 'webglue/quadGeometry';
import Mesh from 'webglue/mesh';

import loadOBJ from 'webglue/loadOBJ';

import { quat } from 'gl-matrix';

// A normal map testing scene.

export default function createScene() {
  let container = new Container();

  let camera = new Camera();
  container.appendChild(camera);

  quat.rotateY(camera.transform.rotation, camera.transform.rotation,
    Math.PI);
  quat.rotateX(camera.transform.rotation, camera.transform.rotation,
    -Math.PI / 4);
  camera.transform.invalidate();

  let light = new DirectionalLight({
    color: new Float32Array([1, 1, 1]),
    ambient: 1,
    diffuse: 1,
    specular: 0.8
  });
  quat.rotateX(light.transform.rotation, light.transform.rotation,
    -Math.PI / 4);
  quat.rotateY(light.transform.rotation, light.transform.rotation,
    Math.PI / 4 * 3);
  light.transform.invalidate();
  container.appendChild(light);

  let quadGeom = new QuadGeometry();

  let material5 = new PhongMaterial({
    diffuseMap: Texture2D.fromImage(require('../texture/stone.jpg')),
    normalMap: Texture2D.fromImage(require('../texture/stone-normal.jpg')),
    specular: new Float32Array([0.3, 0.3, 0.3]),
    diffuse: new Float32Array([0.5, 0.5, 0.5]),
    ambient: new Float32Array([0.5, 0.5, 0.5]),
    shininess: 32.0
  });

  let mesh5 = new Mesh(quadGeom, material5);
  container.appendChild(mesh5);
  mesh5.transform.scale[0] = 10;
  mesh5.transform.scale[2] = 10;
  mesh5.transform.invalidate();

  let theaterMaterials = {
    BlackPlastic: new PhongMaterial({
      specular: new Float32Array([0.21337, 0.21337, 0.21337]),
      diffuse: new Float32Array([0.05136, 0.05295, 0.05630]),
      ambient: new Float32Array([0.1, 0.1, 0.1]),
      shininess: 96
    }),
    RedFabric: new PhongMaterial({
      specular: new Float32Array([0.14, 0.06, 0.06]),
      diffuse: new Float32Array([0.69510, 0.01153, 0.01153]),
      ambient: new Float32Array([0.1, 0.02, 0.02]),
      shininess: 7.843
    }),
    RedFabricNormalMap: new PhongMaterial({
      diffuseMap: Texture2D.fromImage(require('../texture/theaterlowpoly.png')),
      specular: new Float32Array([0.14, 0.06, 0.06]),
      diffuse: new Float32Array([0.69510, 0.01153, 0.01153]),
      ambient: new Float32Array([0.1, 0.02, 0.02]),
      shininess: 7.843
    })
  };

  let objGeom = loadOBJ(require('../geom/theater2.obj'), true);
  objGeom.forEach(geom => {
    console.log(geom.material);
    let mesh4 = new Mesh(geom.geometry,
      theaterMaterials[geom.material]);
    container.appendChild(mesh4);
    mesh4.transform.invalidate();
  });

  let shader6 = new Shader(
    require('../shader/curve.vert'),
    require('../shader/curve.frag')
  );

  let material6 = new Material(shader6);

  let uniQuadGeom = new UniQuadGeometry();
  let mesh6 = new Mesh(uniQuadGeom, material6);
  container.appendChild(mesh6);
  mesh6.transform.scale[0] = 8;
  mesh6.transform.scale[1] = 4;
  mesh6.transform.position[1] = 4;
  mesh6.transform.position[2] = 4;
  quat.rotateY(mesh6.transform.rotation, mesh6.transform.rotation, Math.PI);
  mesh6.transform.invalidate();

  return {
    container, camera, update: () => {
    }
  };
}
