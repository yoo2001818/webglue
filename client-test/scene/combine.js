import boxGeom from 'webglue/geom/box';
import uvSphereGeom from 'webglue/geom/uvSphere';
import transformGeom from 'webglue/geom/transform';
import combineGeom from 'webglue/geom/combine';
import calcNormals from 'webglue/geom/calcNormals';

import { mat3, mat4 } from 'gl-matrix';

export default function combine(renderer) {
  const gl = renderer.gl;
  let geom = renderer.geometries.create(
    combineGeom([calcNormals(boxGeom()),
      transformGeom(uvSphereGeom(32, 16), {
        aPosition: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1]
      })
    ])
  );
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
          position: [0, -8, 3],
          color: '#ffffff',
          intensity: [0.3, 0.7, 1.0, 0.00015]
        }]
      }),
      passes: [{
        shader: shader,
        geometry: geom,
        uniforms: {
          uModel: model1Mat,
          uNormal: model1Normal,
          uMaterial: {
            ambient: '#ffffff',
            diffuse: '#ffffff',
            specular: '#111111',
            shininess: 30
          },
          uTexture: texture
        }
      }]
    });
  };
}
