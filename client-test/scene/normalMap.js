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
  let texture = renderer.textures.create({
    source: require('../texture/texture2.png')
  });
  let normalMap = renderer.textures.create({
    source: require('../texture/texture2_normal.png')
  });

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
            specular: '#555555',
            shininess: 100
          },
          uNormalMap: normalMap,
          uDiffuseMap: texture
        }
      }]
    });
  };
}
