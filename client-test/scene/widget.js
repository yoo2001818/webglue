import translateWidget from 'webglue/geom/translateWidget';

import { mat4 } from 'gl-matrix';

export default function widget(renderer) {
  const gl = renderer.gl;
  let geom = renderer.geometries.create(translateWidget());
  let shader = renderer.shaders.create(
    require('../shader/staticColor.vert'),
    require('../shader/staticColor.frag')
  );

  let model1Mat = mat4.create();

  let projMat = mat4.create();
  let viewMat = mat4.create();
  mat4.translate(viewMat, viewMat, new Float32Array([0, 0, -4]));
  mat4.rotateX(viewMat, viewMat, Math.PI * 1 / 4);

  return (delta) => {
    // TODO We have to receive aspect ratio from renderer, to make it work
    // in a framebuffer
    mat4.perspective(projMat, Math.PI / 180 * 70, gl.drawingBufferWidth /
      gl.drawingBufferHeight, 0.1, 60);
    mat4.rotateY(viewMat, viewMat, Math.PI * delta / 1000 / 2);

    renderer.render({
      options: {
        clearColor: '#222222',
        clearDepth: 1,
        // cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: {
        uProjection: projMat,
        uView: viewMat
      },
      passes: [{
        shader: shader,
        geometry: geom,
        uniforms: {
          uModel: model1Mat
        }
      }]
    });
  };
}
