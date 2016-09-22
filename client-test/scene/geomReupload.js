import quadGeom from 'webglue/geom/quad';
import calcNormals from 'webglue/geom/calcNormals';

import { mat3, mat4 } from 'gl-matrix';

export default function geomReupload(renderer) {
  const gl = renderer.gl;
  let quadData = quadGeom(10, 10);
  let positionBuf = quadData.attributes.aPosition;
  for (let i = 0; i < positionBuf.data.length; i += 3) {
    positionBuf.data[i + 2] = Math.random();
  }
  let quad = renderer.geometries.create(calcNormals(quadData));
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );
  let texture = renderer.textures.create(require('../texture/stone.jpg'));

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();

  let timer = 0;
  return (delta, context) => {
    timer += delta;
    for (let i = 0; i < positionBuf.data.length; i += 3) {
      let x = positionBuf.data[i];
      let y = positionBuf.data[i + 1];
      positionBuf.data[i + 2] = Math.sin(x + y + timer / 300);
    }
    let newData = calcNormals({
      attributes: { aPosition: positionBuf },
      indices: quadData.indices
    });
    quad.update({ attributes: newData.attributes });
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
        geometry: quad,
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
