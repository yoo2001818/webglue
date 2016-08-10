import PhongMaterial from 'webglue/contrib/material/phong';
// import Texture2D from 'webglue/texture2D';
import UniQuadGeometry from 'webglue/geom/uniQuad3DGeometry';
import Mesh from 'webglue/mesh';
import Camera from 'webglue/camera';
import Container from 'webglue/container';
import PointLight from 'webglue/light/point';
import PointLightMesh from 'webglue/contrib/mesh/light/point';

import { quat } from 'gl-matrix';

export default function createScene() {
  let container = new Container();

  let w = 100;
  let h = 100;

  let geometry = new UniQuadGeometry(w - 1, h - 1);

  let camera = new Camera();
  container.appendChild(camera);

  geometry.usage = 'stream';

  quat.rotateY(camera.transform.rotation, camera.transform.rotation,
    Math.PI / 4);
  quat.rotateX(camera.transform.rotation, camera.transform.rotation,
    -Math.PI / 3);
  camera.transform.invalidate();

  let mesh = new Mesh(geometry, new PhongMaterial({
    specular: new Float32Array([0.8, 0.8, 0.8]),
    diffuse: new Float32Array([73 / 255, 25 / 255, 0]),
    ambient: new Float32Array([18 / 255, 6 / 255, 0]),
    shininess: 50.0
  }));
  container.appendChild(mesh);

  let directionalLight = new PointLightMesh(new PointLight({
    color: new Float32Array([1, 1, 1]),
    ambient: 1,
    diffuse: 1,
    specular: 0.8,
    attenuation: 0.0008
  }));
  container.appendChild(directionalLight);

  directionalLight.transform.position[1] = 10;
  directionalLight.transform.position[2] = 8;
  directionalLight.transform.position[0] = 8;
  quat.rotateY(directionalLight.transform.rotation,
    directionalLight.transform.rotation, Math.PI / 4 * 3);
  quat.rotateZ(directionalLight.transform.rotation,
    directionalLight.transform.rotation, -Math.PI / 3);
  directionalLight.transform.invalidate();

  let counter = 0;
  return {
    container, camera, update: (delta) => {
      counter += delta;
      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
          let rx = (x - w / 2) / 3 / w * 100;
          let ry = (y - h / 2) / 3 / h * 100;
          geometry.vertices[(y * w + x) * 3 + 2] =
            Math.sin(Math.sqrt(rx * rx + ry * ry) - counter * 3) / 30
            + Math.sin((rx + ry) / 2 + counter * 2) / 10;
        }
      }
      geometry.calculateNormals(true);
      geometry.valid = false;
    }
  };
}
