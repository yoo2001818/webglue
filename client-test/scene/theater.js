import Camera from 'webglue/camera';
import Container from 'webglue/container';

import PointShadowLight from 'webglue/light/pointShadow';
import PointShadowLightMesh from 'webglue/contrib/mesh/light/pointShadow';
// import DirectionalLight from 'webglue/light/directional';
// import DirectionalLightMesh from '../directionalLightMesh';

import Texture2D from 'webglue/texture2D';
import Shader from 'webglue/shader';
import Material from 'webglue/material';
// import PhongMaterial from '../phongMaterial';
// import QuadGeometry from 'webglue/quadGeometry';
import Mesh from 'webglue/mesh';

import loadOBJ from 'webglue/loader/loadOBJ';
import loadMTL from 'webglue/loader/loadMTL';

import processMTL from 'webglue/contrib/util/processMTL';

import { mat4, vec3, quat } from 'gl-matrix';

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

  let shadowShader = new Shader(
    require('../shader/shadow.vert'),
    require('../shader/shadow.frag')
  );

  let shadowMat = new Material(shadowShader);
  shadowMat.getShader = () => shadowShader;

  let light = new PointShadowLightMesh(new PointShadowLight({
    color: new Float32Array([1, 1, 1]),
    ambient: 0.5,
    diffuse: 1,
    specular: 0.8,
    attenuation: 0,
    camera: {
      fov: Math.PI / 180 * 70,
      near: 4,
      far: 38
    },
    framebuffer: {
      width: 512,
      height: 512,
      mode: 'depth',
      defaultMaterial: shadowMat
    },
    task: {
      frontFace: 'ccw',
      clearColor: [1, 1, 1, 1]
    }
  }));
  light.transform.position[1] = 14;
  light.transform.position[2] = 7;
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

  var video = document.createElement('video');

  video.src = require('../texture/videoTex.webm');
  video.autoPlay = true;
  video.play();
  console.log(video);

  let videoTex = new Texture2D(video, false,{
    mipmap: false,
    minFilter: 'linear',
    wrapS: 'clamp',
    wrapT: 'clamp'
  });
  videoTex.update = 3;

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
      'theaterScreen.png': videoTex
    }));

  let objGeom = loadOBJ(require('../geom/theaterbuilding2.obj'), true);
  objGeom.forEach(geom => {
    console.log(geom.material);
    let mesh4 = new Mesh(geom.geometry,
      theaterMaterials[geom.material]);
    container.appendChild(mesh4);
    mesh4.transform.invalidate();
  });

  let chairMaterials = processMTL(
    loadMTL(require('../geom/theater2.mtl'), {
      'theaterlowpoly.png':
        Texture2D.fromImage(require('../texture/theaterlowpoly.png'))
    }));

  let chairGeom = loadOBJ(require('../geom/theater2.obj'), true);

  let chairMeshes = [];

  window.addEventListener('keydown', e => {
    if (e.keyCode === 82) {
      chairMeshes.forEach(mesh => {
        container.removeChild(mesh.mesh);
      });
      chairMeshes = [];
    }
  });

  return {
    container, camera, update: () => {
      chairMeshes.forEach(options => {
        // This looks horrible.
        quat.multiply(options.mesh.transform.rotation,
          options.parent.transform.rotation, options.originRot);
        quat.rotateZ(options.mesh.transform.rotation,
          options.mesh.transform.rotation,
          Math.sin(Date.now() / 300) * Math.PI / 10);
        vec3.transformMat4(options.mesh.transform.position, options.originPos,
          options.parent.transform.matrix);
        options.mesh.transform.invalidate();
      });
    },
    onSelect: (pos, collisionMesh, collisionFace) => {
      if (collisionMesh == null) return;
      // Extract collision face's normal and tangent.
      let indices = collisionMesh.geometry.getIndices();
      // Calculate normal
      let normalData = collisionMesh.geometry.getAttributes().aNormal.data;
      let normal = vec3.create();
      vec3.add(normal, normal, normalData.slice(
        indices[collisionFace] * 3, indices[collisionFace] * 3 + 3));
      vec3.add(normal, normal, normalData.slice(
        indices[collisionFace + 1] * 3, indices[collisionFace + 1] * 3 + 3));
      vec3.add(normal, normal, normalData.slice(
        indices[collisionFace + 2] * 3, indices[collisionFace + 2] * 3 + 3));
      vec3.normalize(normal, normal);
      let normal2 = vec3.create();
      vec3.transformMat3(normal2, normal, collisionMesh.normalMatrix);

      // Convert the points to local point
      let invMat = mat4.create();
      mat4.invert(invMat, collisionMesh.transform.matrix);
      let originPos = vec3.create();
      vec3.transformMat4(originPos, pos, invMat);

      let originRot = quat.create();
      quat.rotationTo(originRot, [0, 1, 0], normal);
      quat.rotateY(originRot, originRot, Math.PI);

      // :P
      let actualRot = quat.create();
      quat.rotationTo(actualRot, [0, 1, 0], normal2);
      quat.rotateY(actualRot, actualRot,
        Math.PI);

      chairGeom.forEach(geom => {
        let mesh = new Mesh(geom.geometry,
          chairMaterials[geom.material]);
        container.appendChild(mesh);
        mesh.transform.invalidate();
        vec3.copy(mesh.transform.position, pos);
        quat.copy(mesh.transform.rotation, actualRot);

        chairMeshes.push({
          mesh, originRot, originPos, parent: collisionMesh
        });
      });
    }
  };
}
