export default function buffer(renderer) {
  const gl = renderer.gl;

  let buffer = renderer.geometries.createBuffer([
    0, 0
  ]);
  let geom = renderer.geometries.create({
    attributes: {
      aPosition: [[0], [1]],
      aStart: {
        buffer, offset: 0, axis: 2, stride: 8, instanced: 1
      },
      aEnd: {
        buffer, offset: 8, axis: 2, stride: 8, instanced: 1
      }
    },
    mode: gl.LINES
  });

  let shader = renderer.shaders.create(
    require('../shader/screenLine.vert'),
    require('../shader/monoColor.frag')
  );
  let drawTimer = 0;
  return {
    update(delta, context) {
      drawTimer += delta;
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
          geometry: geom,
          uniforms: {
            uColor: '#ffffffff'
          }
        }]
      });
    },
    mousemove(event, ndc) {
      if (drawTimer < 1/40) return;
      drawTimer = 0;
      let newArray = new Float32Array(buffer.data.length + 2);
      newArray.set(buffer.data);
      newArray.set(ndc, buffer.data.length);
      buffer.update(newArray);
      geom.update({
        attributes: {
          aStart: {
            buffer, offset: 0, axis: 2, stride: 8, instanced: 1
          },
          aEnd: {
            buffer, offset: 8, axis: 2, stride: 8, instanced: 1
          }
        }
      });
    }
  };
}
