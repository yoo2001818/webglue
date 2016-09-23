import loadOBJ from 'webglue/loader/obj';
import loadMTL from 'webglue/loader/mtl';
import channelGeom from 'webglue/geom/channel';
import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';
import calcTangents from 'webglue/geom/calcTangents';

import { mat3, mat4 } from 'gl-matrix';

export default function theater(renderer) {
  const gl = renderer.gl;
  let materials = loadMTL(require('../geom/theater2.mtl'), {
    'theaterlowpoly.png': renderer.textures.create(
      require('../texture/theaterlowpoly.png'))
  });
  let geometries = channelGeom(loadOBJ(require('../geom/theater2.obj'), true));
  geometries.forEach(geometry => {
    geometry.geometry = renderer.geometries.create(geometry);
  });
  let box = renderer.geometries.create(calcTangents(calcNormals(boxGeom())));
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );
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
          position: [0, 5, 8],
          color: '#ffffff',
          intensity: [0.1, 0.7, 1.0, 0.00015]
        }]
      }),
      passes: [{
        shader: shader,
        uniforms: {
          uModel: model1Mat,
          uNormal: model1Normal,
          uHeightMapScale: [0.2, 1.1]
          // uEnvironmentMap: skybox
          // uHeightMap: heightMap,
          // uDiffuseMap: texture
        },
        passes: geometries.map(geometry => {
          let material = materials[geometry.material];
          return {
            geometry: geometry.geometry,
            uniforms: {
              uNormalMap: material.normalMap,
              uMaterial: material
            }
          };
        })
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
