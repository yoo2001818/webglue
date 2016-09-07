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

  return (delta, context) => {
    renderer.render({
      options: {
        clearColor: '#222222',
        clearDepth: 1,
        // cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: context.camera,
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
