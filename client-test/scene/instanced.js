import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';

import { mat3, mat4 } from 'gl-matrix';

export default function instanced(renderer) {
  const gl = renderer.gl;
  let box = renderer.geometries.create(calcNormals(boxGeom()));
  function range(v) {
    let out = [];
    for (let i = 0; i < v; ++i) out.push(i);
    return out;
  }

  // Test instancing data...
  let instancedData = renderer.geometries.create({
    attributes: {
      aInstPos: range(100).map(() => [
        Math.random() * 50 - 25, Math.random() * 50 - 25,
        Math.random() * 50 - 25
      ])
    },
    instanced: {
      aInstPos: 1
    }
  });
  let boxes = renderer.geometries.create([box, instancedData]);
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );
  let texture = renderer.textures.create({
    source: require('../texture/2.png')
  });

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();

  let projMat = mat4.create();
  let viewMat = mat4.create();
  mat4.translate(viewMat, viewMat, new Float32Array([0, 0, -5]));

  return (delta) => {
    // TODO We have to receive aspect ratio from renderer, to make it work
    // in a framebuffer
    mat4.perspective(projMat, Math.PI / 180 * 70, gl.drawingBufferWidth /
      gl.drawingBufferHeight, 0.1, 60);
    mat4.rotateY(viewMat, viewMat, Math.PI * delta / 1000 / 4);

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
          position: [0, -3, 0],
          color: '#ffffff',
          intensity: [0.3, 0.7, 0.5, 0.00015]
        }]
      },
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
          uTexture: texture
        }
      }]
    });
  };
}
