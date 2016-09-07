import gridGeom from 'webglue/geom/grid';
import { mat3, mat4 } from 'gl-matrix';

export default function grid(renderer) {
  // const gl = renderer.gl;
  let grid = renderer.geometries.create(gridGeom(17, 17, 0.2));
  let shader = renderer.shaders.create(
    require('../shader/grid.vert'),
    require('../shader/grid.frag')
  );

  let model1Mat = mat4.create();
  mat4.rotateX(model1Mat, model1Mat, Math.PI * -90 / 180);

  return (delta, context) => {
    // mat4.rotateZ(model1Mat, model1Mat, Math.PI * delta / 1000 / 2);

    renderer.render({
      options: {
        clearColor: '#404040'
      },
      uniforms: context.camera,
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
