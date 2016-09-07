import uvSphereGeom from 'webglue/geom/uvSphere';
import wireframeGeom from 'webglue/geom/wireframe';

import { mat4 } from 'gl-matrix';

export default function wireframe(renderer) {
  const gl = renderer.gl;
  let geom = renderer.geometries.create(wireframeGeom(uvSphereGeom(16, 24)));
  let shader = renderer.shaders.create(
    require('../shader/minimal.vert'),
    require('../shader/monoColor.frag')
  );

  let model1Mat = mat4.create();

  let projMat = mat4.create();
  let viewMat = mat4.create();
  mat4.translate(viewMat, viewMat, new Float32Array([0, 0, -4]));

  return (delta) => {
    // TODO We have to receive aspect ratio from renderer, to make it work
    // in a framebuffer
    mat4.perspective(projMat, Math.PI / 180 * 70, gl.drawingBufferWidth /
      gl.drawingBufferHeight, 0.1, 60);
    mat4.rotateY(model1Mat, model1Mat, Math.PI * delta / 1000 / 2);

    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
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
          uModel: model1Mat,
          uColor: '#ffffff'
        }
      }]
    });
  };
}
