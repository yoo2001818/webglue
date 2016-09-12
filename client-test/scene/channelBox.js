import channelGeom from 'webglue/geom/channel';
import calcNormals from 'webglue/geom/calcNormals';

import { mat3, mat4 } from 'gl-matrix';

export default function channelBox(renderer) {
  const gl = renderer.gl;
  let box = renderer.geometries.create(calcNormals(channelGeom({
    attributes: {
      aPosition: {
        data: new Float32Array([
          -1, -1, 1,
          1, -1, 1,
          1, 1, 1,
          -1, 1, 1,

          1, -1, -1,
          -1, -1, -1,
          -1, 1, -1,
          1, 1, -1
        ]),
        axis: 3
      },
      aTexCoord: {
        data: new Float32Array([
          0, 0,
          1, 0,
          0, 1,
          1, 1
        ]),
        axis: 2
      }
    },
    indices: {
      aPosition: [
        0, 1, 2, 2, 3, 0,
        4, 5, 6, 6, 7, 4,
        1, 4, 7, 7, 2, 1,
        5, 0, 3, 3, 6, 5,
        3, 2, 7, 7, 6, 3,
        5, 4, 1, 1, 0, 5
      ],
      aTexCoord: [
        0, 1, 3, 3, 2, 0,
        0, 1, 3, 3, 2, 0,
        0, 1, 3, 3, 2, 0,
        0, 1, 3, 3, 2, 0,
        0, 1, 3, 3, 2, 0,
        0, 1, 3, 3, 2, 0
      ]
    }
  })));
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );
  let texture = renderer.textures.create({
    source: require('../texture/2.png')
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
          intensity: [0.3, 0.7, 0.5, 0.00015]
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
            shininess: 30
          },
          uTexture: texture
        }
      }]
    });
  };
}
