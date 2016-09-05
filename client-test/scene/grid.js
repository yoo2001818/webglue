import gridGeom from 'webglue/geom/grid';
import { mat3, mat4 } from 'gl-matrix';

export default function grid(renderer) {
  const gl = renderer.gl;
  let grid = renderer.geometries.create(gridGeom(17, 17, 0.2));
  let shader = renderer.shaders.create(
    require('../shader/grid.vert'),
    require('../shader/grid.frag')
  );

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();
  mat4.rotateX(model1Mat, model1Mat, Math.PI * -45 / 180);

  let projMat = mat4.create();
  let viewMat = mat4.create();
  mat4.translate(viewMat, viewMat, new Float32Array([0, 0, -4]));

  return (delta) => {
    // TODO We have to receive aspect ratio from renderer, to make it work
    // in a framebuffer
    mat4.perspective(projMat, Math.PI / 180 * 70, gl.drawingBufferWidth /
      gl.drawingBufferHeight, 0.1, 60);
    mat4.rotateZ(model1Mat, model1Mat, Math.PI * delta / 1000 / 2);
    mat3.normalFromMat4(model1Normal, model1Mat);

    renderer.render({
      options: {
        clearColor: '#404040'
      },
      uniforms: {
        uProjection: projMat,
        uView: viewMat
      },
      passes: [{
        shader: shader,
        geometry: grid,
        uniforms: {
          uModel: model1Mat,
          uColor: '#6F6F6F',
          uHoriColor: '#ff0000',
          uVertColor: '#00ff00'
        }
      }]
    });
  };
}
