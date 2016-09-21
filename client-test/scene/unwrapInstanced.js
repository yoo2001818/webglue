import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';
import unwrapInstancedGeom from 'webglue/geom/unwrapInstanced';

import { mat3, mat4 } from 'gl-matrix';

export default function unwrapInstanced(renderer) {
  const gl = renderer.gl;
  let boxData = calcNormals(boxGeom());
  function range(v) {
    let out = [];
    for (let i = 0; i < v; ++i) out.push(i);
    return out;
  }
  boxData.attributes.aInstPos = range(100).map(() => [
    Math.random() * 50 - 25, Math.random() * 50 - 25,
    Math.random() * 50 - 25
  ]);
  boxData.instanced = {
    aInstPos: 1
  };
  boxData = unwrapInstancedGeom(boxData);
  let boxes = renderer.geometries.create(boxData);
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );
  let texture = renderer.textures.create(require('../texture/2.png'));

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
          position: [0, -3, 0],
          color: '#ffffff',
          intensity: [0.3, 0.7, 0.5, 0.00015]
        }]
      }),
      passes: [{
        shader: shader,
        geometry: boxes,
        uniforms: {
          uModel: model1Mat,
          uNormal: model1Normal,
          uMaterial: {
            ambient: '#ffffff',
            diffuse: '#ffffff',
            specular: '#555555',
            shininess: 30
          },
          uDiffuseMap: texture
        }
      }]
    });
  };
}
