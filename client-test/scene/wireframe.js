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

  return (delta, context) => {
    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: context.camera,
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
