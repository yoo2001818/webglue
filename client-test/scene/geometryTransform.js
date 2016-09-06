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

  let projMat = mat4.create();
  let viewMat = mat4.create();
  mat4.translate(viewMat, viewMat, new Float32Array([0, 0, -4]));

  return (delta) => {
    // TODO We have to receive aspect ratio from renderer, to make it work
    // in a framebuffer
    mat4.perspective(projMat, Math.PI / 180 * 70, gl.drawingBufferWidth /
      gl.drawingBufferHeight, 0.1, 60);
    mat4.rotateY(model1Mat, model1Mat, Math.PI * delta / 1000 / 2);
    mat3.normalFromMat4(model1Normal, model1Mat);

    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: {
        uProjection: projMat,
        uView: viewMat,
        uPointLight: [{
          position: [0, 0, 8],
          color: '#ffffff',
          intensity: [0.3, 0.7, 0.5, 0.00015]
        }]
      },
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
