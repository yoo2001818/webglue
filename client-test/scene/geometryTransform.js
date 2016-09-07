import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';
import transform from 'webglue/geom/transform';

import { mat3, mat4 } from 'gl-matrix';

export default function geometryTransform(renderer) {
  const gl = renderer.gl;
  let box = renderer.geometries.create(calcNormals(transform(boxGeom(), {
    aTexCoord: [2, 0, 0, 2],
    aPosition: v => v[0] = v[1] * v[0]
  })));
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );
  let texture = renderer.textures.create({
    source: require('../texture/2.png'),
    params: {
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT
    }
  });

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();

  return (delta, context) => {

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
