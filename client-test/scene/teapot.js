import loadOBJ from 'webglue/loader/obj';
import channelGeom from 'webglue/geom/channel';
import calcNormals from 'webglue/geom/calcNormals';
import transformGeom from 'webglue/geom/transform';
import boxGeom from 'webglue/geom/box';
import quadGeom from 'webglue/geom/quad';

import { mat3, mat4 } from 'gl-matrix';

export default function teapot(renderer) {
  const gl = renderer.gl;
  let originalData = channelGeom(loadOBJ(require('../geom/wt-teapot.obj')));
  let teapot = renderer.geometries.create(originalData);
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );

  let quad = renderer.geometries.create(transformGeom(calcNormals(quadGeom()), {
    aTexCoord: [
      2, 0,
      0, 2
    ]
  }));
  let floorTexture = renderer.textures.create({
    source: require('../texture/wood4.jpg'),
    params: {
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT
    }
  });

  let box = renderer.geometries.create(boxGeom());
  let skybox = renderer.textures.create({
    source: [
      require('../texture/stormyday/front.jpg'),
      require('../texture/stormyday/back.jpg'),
      require('../texture/stormyday/down.jpg'),
      require('../texture/stormyday/up.jpg'),
      require('../texture/stormyday/right.jpg'),
      require('../texture/stormyday/left.jpg')
    ]
  });
  let skyboxShader = renderer.shaders.create(
    require('../shader/skybox.vert'),
    require('../shader/skybox.frag')
  );

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();

  let floorMat = mat4.create();
  let floorNormal = mat3.create();

  mat4.scale(floorMat, floorMat, [3.5, 3.5, 3.5]);
  mat4.rotateX(floorMat, floorMat, -Math.PI / 2);
  mat3.normalFromMat4(floorNormal, floorMat);

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
          position: [Math.sin(timer / 1000) * 8,
            10, Math.cos(timer / 1000) * 8],
          color: '#ffffff',
          intensity: [0.3, 1.0, 1.0, 0.00015]
        }]
      }),
      passes: [{
        shader: shader,
        geometry: teapot,
        uniforms: {
          uModel: model1Mat,
          uNormal: model1Normal,
          uEnvironment: skybox,
          uMaterial: {
            ambient: '#aaaaaa',
            diffuse: '#aaaaaa',
            specular: '#444444',
            reflectivity: '#292929',
            shininess: [90, 140/256]
          }
        }
      }, {
        shader: shader,
        geometry: quad,
        uniforms: {
          uModel: floorMat,
          uNormal: floorNormal,
          uTexture: floorTexture,
          uEnvironment: skybox,
          uMaterial: {
            ambient: '#ffffff',
            diffuse: '#999999',
            specular: '#222222',
            reflectivity: '#52514F',
            shininess: [30, 83/256]
          }
        }
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
