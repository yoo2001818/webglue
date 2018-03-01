import loadOBJ from 'webglue/loader/obj';
import channelGeom from 'webglue/geom/channel/channelOld';
import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';
import onLoad from 'webglue/util/onLoad';

import { mat3, mat4 } from 'gl-matrix';

export default function asyncOBJ(renderer) {
  const gl = renderer.gl;
  let geom = renderer.geometries.create(
    fetch(require('!!file-loader!../geom/bunny.obj'))
    .then(res => res.text())
    .then(data => channelGeom(loadOBJ(data)))
  );
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );

  let box = renderer.geometries.create(calcNormals(boxGeom()));
  let skybox = renderer.textures.create([
    require('../texture/stormyday/front.jpg'),
    require('../texture/stormyday/back.jpg'),
    require('../texture/stormyday/down.jpg'),
    require('../texture/stormyday/up.jpg'),
    require('../texture/stormyday/right.jpg'),
    require('../texture/stormyday/left.jpg')
  ]);
  let skyboxShader = renderer.shaders.create(
    require('../shader/skybox.vert'),
    require('../shader/skybox.frag')
  );

  let loaded = false;
  onLoad([geom, skybox], () => {
    loaded = true;
  });

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();

  let timer = 0;
  return (delta, context) => {
    timer += delta;
    // mat4.rotateY(model1Mat, model1Mat, Math.PI * delta / 1000 / 2);
    // mat3.normalFromMat4(model1Normal, model1Mat);

    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: Object.assign({}, context.camera, {
        uPointLight: [{
          position: [Math.sin(timer) * 5, 5, Math.cos(timer) * 5],
          color: '#ffffff',
          intensity: [0.1, 0.7, 1.0, 0.00015]
        }],
        uEnvironmentMap: skybox
      }),
      passes: [{
        shader: shader,
        uniforms: {
          uModel: model1Mat,
          uNormal: model1Normal,
          uMaterial: {
            ambient: '#aaaaaa',
            diffuse: '#aaaaaa',
            specular: '#444444',
            reflectivity: '#8c444444',
            shininess: 90
          }
        },
        geometry: loaded ? geom : box
      }, {
        shader: skyboxShader,
        geometry: box,
        options: {
          cull: gl.FRONT
        },
        uniforms: {
          uSkybox: skybox
        }
      }]
    });
  };
}
