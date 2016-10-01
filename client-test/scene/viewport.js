import boxGeom from 'webglue/geom/box';
import quadGeom from 'webglue/geom/quad';

function lerp(min, max, val) {
  return min + (max - min) * val;
}

export default function viewport(renderer) {
  const gl = renderer.gl;

  let box = renderer.geometries.create(boxGeom());
  let skybox = renderer.textures.create([
    require('../texture/stormyday/front.jpg'),
    require('../texture/stormyday/back.jpg'),
    require('../texture/stormyday/down.jpg'),
    require('../texture/stormyday/up.jpg'),
    require('../texture/stormyday/right.jpg'),
    require('../texture/stormyday/left.jpg')
  ]);
  let skyboxShader = renderer.shaders.create(
    require('../shader/skybox.vert'),
    require('../shader/skybox.frag')
  );

  let quad = renderer.geometries.create(quadGeom());
  let coverShader = renderer.shaders.create(
    require('../shader/screen.vert'),
    require('../shader/monoColor.frag')
  );

  let timer = 0;
  return (delta, context) => {
    timer += delta;
    let width = gl.drawingBufferWidth;
    let height = gl.drawingBufferHeight;
    let offsetX = timer / 8 / 2 % 2 | 0;
    let offsetY = timer / 8 % 2 | 0;
    let timeOffset = Math.min(1, Math.max(0, ((timer % 8) - 4) * 2));
    let alphaOffset = 1;
    if ((timer % 8) < 0.5) alphaOffset = (timer % 8) * 2;
    if ((timer % 8) > 6) alphaOffset = Math.max(0, 7 - (timer % 8));
    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL,
        viewport: [
          lerp(0, 60 + offsetX * (width - 120) * 0.3, timeOffset),
          lerp(0, 60 + offsetY * (height - 120) * 0.3, timeOffset),
          lerp(width, (width - 120) * 0.7, timeOffset),
          lerp(height, (height - 120) * 0.7, timeOffset)
        ]
      },
      uniforms: context.camera,
      passes: [{
        shader: skyboxShader,
        geometry: box,
        options: {
          cull: gl.FRONT
        },
        uniforms: {
          uSkybox: skybox
        }
      }, {
        shader: coverShader,
        geometry: quad,
        options: {
          blend: {
            func: [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA]
          }
        },
        uniforms: {
          uColor: [0, 0, 0, 1 - alphaOffset]
        }
      }]
    });
  };
}
