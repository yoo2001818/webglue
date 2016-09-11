import translateWidget from 'webglue/geom/translateWidget';
import scaleWidget from 'webglue/geom/scaleWidget';
import rotateWidget from 'webglue/geom/rotateWidget';
import Transform from 'webglue/transform';

export default function widget(renderer) {
  const gl = renderer.gl;
  let translate = renderer.geometries.create(translateWidget());
  let scale = renderer.geometries.create(scaleWidget());
  let rotate = renderer.geometries.create(rotateWidget());
  let shader = renderer.shaders.create(
    require('../shader/widget.vert'),
    require('../shader/staticColor.frag')
  );
  let shaderRotate = renderer.shaders.create(
    require('../shader/widgetRotate.vert'),
    require('../shader/widgetRotate.frag')
  );

  let model1 = new Transform();
  let model2 = new Transform([2, 0, 0]);
  let model3 = new Transform([-2, 0, 0]);

  return (delta, context) => {
    renderer.render({
      options: {
        clearColor: '#222222',
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: context.camera,
      passes: [{
        shader: shader,
        geometry: translate,
        uniforms: {
          uModel: model1.get
        }
      }, {
        shader: shader,
        geometry: scale,
        uniforms: {
          uModel: model2.get
        }
      }, {
        shader: shaderRotate,
        geometry: rotate,
        uniforms: {
          uModel: model3.get
        }
      }]
    });
  };
}
