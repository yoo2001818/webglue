import Camera from 'webglue/camera';
import Container from 'webglue/container';

import PointLight from 'webglue/light/point';
import PointLightMesh from '../pointLightMesh';
import DirectionalLight from 'webglue/light/directional';
// import DirectionalLightMesh from '../directionalLightMesh';

import Texture2D from 'webglue/texture2D';
import Shader from 'webglue/shader';
import Material from 'webglue/material';
import PhongMaterial from '../phongMaterial';
import UniQuadGeometry from 'webglue/uniQuadGeometry';
import QuadGeometry from 'webglue/quadGeometry';
import Mesh from 'webglue/mesh';

import loadOBJ from 'webglue/loader/loadOBJ';
import loadMTL from 'webglue/loader/loadMTL';

import processMTL from '../processMTL';

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

  let light = new PointLightMesh(new PointLight({
    color: new Float32Array([1, 1, 1]),
    ambient: 0.5,
    diffuse: 1,
    specular: 0.8,
    attenuation: 0
  }));
  light.transform.position[1] = 14;
  quat.rotateX(light.transform.rotation, light.transform.rotation,
    -Math.PI / 4);
  quat.rotateY(light.transform.rotation, light.transform.rotation,
    Math.PI / 2);
  light.transform.invalidate();
  container.appendChild(light);

  /* let quadGeom = new QuadGeometry();

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
  mesh5.transform.invalidate(); */

  // Welcome to ... LISP? (shrugs)
  let theaterMaterials = processMTL(
    loadMTL(require('../geom/theaterbuilding2.mtl'), {
      'theaterWall.png':
        Texture2D.fromImage(require('../texture/theaterWall.png')),
      'theaterFloor.png':
        Texture2D.fromImage(require('../texture/theaterFloor.png')),
      'theaterFloorEmit.png':
        Texture2D.fromImage(require('../texture/theaterFloorEmit.png')),
      'theaterExit.png':
        Texture2D.fromImage(require('../texture/theaterExit.png')),
      'theaterScreen.png':
        Texture2D.fromImage(require('../texture/theaterScreen.png'), {
          mipmap: false,
          minFilter: 'linear',
          wrapS: 'clamp',
          wrapT: 'clamp'
        })
    }));

  let objGeom = loadOBJ(require('../geom/theaterbuilding2.obj'), true);
  objGeom.forEach(geom => {
    console.log(geom.material);
    let mesh4 = new Mesh(geom.geometry,
      theaterMaterials[geom.material]);
    container.appendChild(mesh4);
    mesh4.transform.invalidate();
  });

  /*let shader6 = new Shader(
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
  mesh6.transform.invalidate();*/

  return {
    container, camera, update: () => {
    }
  };
}
