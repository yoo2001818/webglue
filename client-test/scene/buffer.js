export default function buffer(renderer) {
  const gl = renderer.gl;

  let buffer = renderer.geometries.createBuffer([
    -1, -1, -1, 0.5, 0.5, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 0.5, 0.5
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
        geometry: geom,
        uniforms: {
          uColor: '#ffffffff'
        }
      }]
    });
  };
}
