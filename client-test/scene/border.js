import loadOBJ from 'webglue/loader/obj';
import channelGeom from 'webglue/geom/channel';
import MeshTransform from 'webglue/meshTransform';

export default function border(renderer) {
  const gl = renderer.gl;

  let originalData = channelGeom(loadOBJ(require('../geom/wt-teapot.obj')));
  let teapot = renderer.geometries.create(originalData);
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );
  let monoShader = renderer.shaders.create(
    require('../shader/minimalBias.vert'),
    require('../shader/monoColor.frag')
  );

  let teapotTransform = new MeshTransform();

  let timer = 0;
  return (delta, context) => {
    timer += delta;

    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: Object.assign({}, context.camera, {
        uPointLight: [{
          position: [Math.sin(timer) * 8,
            8, Math.cos(timer) * 8],
          color: '#aaaaaa',
          intensity: [0.3, 1.0, 1.0, 0.00015]
        }]
      }),
      passes: [{
        geometry: teapot,
        uniforms: {
          uModel: teapotTransform.get,
          uNormal: teapotTransform.getNormal,
          uMaterial: {
            ambient: '#aaaaaa',
            diffuse: '#aaaaaa',
            specular: '#444444',
            reflectivity: '#8c292929',
            shininess: 90
          }
        },
        passes: [{
          options: {
            cull: gl.FRONT,
            depthMask: true
          },
          uniforms: {
            uBias: [0.02, 0.02],
            uColor: '#ffffff'
          },
          shader: monoShader
        }, {
          shader: shader
        }]
      }]
    });
  };
}
