import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';
import calcTangents from 'webglue/geom/calcTangents';

import { mat3, mat4 } from 'gl-matrix';

export default function normalMap(renderer) {
  const gl = renderer.gl;
  let box = renderer.geometries.create(calcTangents(calcNormals(boxGeom())));
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );
  let texture = renderer.textures.create(
    require('../texture/stone.jpg'), {
      params: {
        wrapS: gl.REPEAT,
        wrapT: gl.REPEAT,
      }
    });
  let normalMap = renderer.textures.create(
    require('../texture/stone-normal.jpg'));
  let bumpMap = renderer.textures.create(
    require('../texture/heightmap.png'));
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

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();

  return (delta, context) => {
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
          position: [0, 0, 8],
          color: '#ffffff',
          intensity: [0.3, 0.7, 1.0, 0.00015]
        }]
      }),
      passes: [{
        shader: shader,
        geometry: box,
        uniforms: {
          uModel: model1Mat,
          uNormal: model1Normal,
          uMaterial: {
            ambient: '#ffffff',
            diffuse: '#ffffff',
            specular: '#444444',
            reflectivity: '#ff333333',
            shininess: 100
          },
          uHeightMapScale: [0.05, 1.1],
          uEnvironmentMap: skybox,
          uNormalMap: normalMap,
          uHeightMap: bumpMap,
          uDiffuseMap: texture
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
