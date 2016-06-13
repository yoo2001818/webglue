import Camera from 'webglue/camera';
import Container from 'webglue/container';

import PointShadowLight from 'webglue/light/point';
import PointShadowLightMesh from '../pointShadowLightMesh';
import SkyBox from '../skyBox';

import TextureCube from 'webglue/textureCube';
import Texture2D from 'webglue/texture2D';
import Shader from 'webglue/shader';
import Material from 'webglue/material';
import PhongMaterial from '../phongMaterial';
// import UniQuadGeometry from 'webglue/uniQuadGeometry';
import QuadGeometry from 'webglue/quadGeometry';
import BoxGeometry from '../channelBoxGeometry';
import Mesh from 'webglue/mesh';

import UVSphereGeometry from 'webglue/uvSphereGeometry';
import loadOBJ from 'webglue/loader/loadOBJ';

import { quat, vec3 } from 'gl-matrix';

// A normal map testing scene.

export default function createScene() {
  let container = new Container();

  let camera = new Camera();
  container.appendChild(camera);

  quat.rotateX(camera.transform.rotation, camera.transform.rotation,
    -Math.PI / 4);
  camera.transform.invalidate();

  let shadowShader = new Shader(
    require('../shader/shadow.vert'),
    require('../shader/shadow.frag')
  );

  let shadowMat = new Material(shadowShader);
  shadowMat.getShader = () => shadowShader;

  let pointLight = new PointShadowLightMesh(new PointShadowLight({
    color: new Float32Array([1, 1, 1]),
    ambient: 0.2,
    diffuse: 1,
    specular: 0.8,
    attenuation: 0.0004,
    camera: {
      fov: Math.PI / 180 * 70,
      near: 2,
      far: 26
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
  container.appendChild(pointLight);

  let boxGeom = new BoxGeometry();
  let material = new PhongMaterial({
    normalMap: Texture2D.fromImage(require('../texture/crate-normal.png')),
    heightMap: Texture2D.fromImage(require('../texture/crate-height.png')),
    heightMapScale: 0.1,
    heightMapDecay: 1.5,
    diffuseMap: Texture2D.fromImage(require('../texture/crate.jpg')),
    specular: new Float32Array([0.2, 0.2, 0.2]),
    diffuse: new Float32Array([1, 1, 1]),
    ambient: new Float32Array([0.5, 0.5, 0.5]),
    shininess: 10.0
  });

  let mesh = new Mesh(boxGeom, material);
  container.appendChild(mesh);

  let material2 = new PhongMaterial({
    specular: new Float32Array([0.5, 0.5, 0.5]),
    diffuse: new Float32Array([0.5, 0.5, 0.5]),
    ambient: new Float32Array([0.5, 0.5, 0.5]),
    shininess: 32.0
  });

  let mesh2 = new Mesh(boxGeom, material2);
  container.appendChild(mesh2);
  mesh2.transform.position[0] = 3;
  mesh2.transform.invalidate();

  let quadGeom = new QuadGeometry();

  let material5 = new PhongMaterial({
    specular: new Float32Array([0.3, 0.3, 0.3]),
    diffuse: new Float32Array([0.5, 0.5, 0.5]),
    ambient: new Float32Array([0.5, 0.5, 0.5]),
    shininess: 32.0
  });

  let mesh5 = new Mesh(quadGeom, material5);
  container.appendChild(mesh5);
  mesh5.transform.position[1] = -1;
  mesh5.transform.scale[0] = 10;
  mesh5.transform.scale[2] = 10;
  mesh5.transform.invalidate();

  let skyboxTexture = TextureCube.fromImage([
    require('../texture/stormyday/front.jpg'),
    require('../texture/stormyday/back.jpg'),
    require('../texture/stormyday/up.jpg'),
    require('../texture/stormyday/down.jpg'),
    require('../texture/stormyday/right.jpg'),
    require('../texture/stormyday/left.jpg')
  ]);

  let skybox = new SkyBox(skyboxTexture);
  container.appendChild(skybox);

  let sphereGeom = new UVSphereGeometry(32, 16);
  let material3 = new PhongMaterial({
    diffuseMap: Texture2D.fromImage(require('../texture/earth.jpg')),
    specular: new Float32Array([0.2, 0.2, 0.2]),
    diffuse: new Float32Array([1, 1, 1]),
    ambient: new Float32Array([0.2, 0.2, 0.2]),
    shininess: 10.0
  });

  let mesh3 = new Mesh(sphereGeom, material3);
  container.appendChild(mesh3);
  mesh3.transform.position[0] = -3;
  // vec3.set(mesh4.transform.scale, 10, 10, 10);
  mesh3.transform.invalidate();

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
      normalMap: Texture2D.fromImage(require('../texture/theaterlowpoly.png')),
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
    mesh4.transform.position[1] = 1;
    mesh4.transform.invalidate();
  });

  /*let shader6 = new Shader(
    require('../shader/screen.vert'),
    require('../shader/screen.frag')
  );

  let material6 = new Material(shader6);
  material6.use = () => ({
    uTexture: pointLight.light.colorTexture,
    uScreenSize: (context) => new Float32Array([
      context.width, context.height
    ]),
    uTextureSize: () => new Float32Array([
      pointLight.light.colorTexture.width,
      pointLight.light.colorTexture.height
    ])
  });
  material6.update = true;

  let uniQuadGeom = new UniQuadGeometry();
  let mesh6 = new Mesh(uniQuadGeom, material6);
  container.appendChild(mesh6);*/

  return {
    container, camera, update: () => {
      mesh3.transform.position[0] = Math.cos(Date.now() / 500) * 5;
      mesh3.transform.position[1] = Math.abs(Math.sin(Date.now() / 150) * 2);
      mesh3.transform.position[2] = Math.sin(Date.now() / 500) * 5;
      mesh3.transform.invalidate();
      pointLight.transform.position[0] = Math.cos(Date.now() / 500) * 10;
      pointLight.transform.position[1] = 6;
      pointLight.transform.position[2] = Math.sin(Date.now() / 500) * 10;
      // Building transform matrix and quaternion from it doesn't seem to
      // work well, so I've decided to use euler rotation (pitch, yaw).
      let viewDir = vec3.create();
      vec3.normalize(viewDir, pointLight.transform.position);
      vec3.scale(viewDir, viewDir, -1);
      let pitch = Math.asin(viewDir[1]);
      let yaw = Math.atan2(-viewDir[2], viewDir[0]);
      quat.identity(pointLight.transform.rotation);
      quat.rotateY(pointLight.transform.rotation, pointLight.transform.rotation,
        yaw);
      quat.rotateZ(pointLight.transform.rotation, pointLight.transform.rotation,
        pitch);
      pointLight.transform.invalidate();
    }
  };
}
