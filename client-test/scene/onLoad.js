import quadGeom from 'webglue/geom/quad';
import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';
import loadWait from 'webglue/util/onLoad';

import { mat3, mat4 } from 'gl-matrix';

export default function onLoad(renderer) {
  const gl = renderer.gl;

  let quad = renderer.geometries.create(quadGeom());
  let inTexture = renderer.textures.create(require('../texture/stone.jpg'));
  let outTexture = renderer.textures.create(null, {
    width: 1024,
    height: 1024
  });
  let framebuffer = renderer.framebuffers.create({
    color: { texture: outTexture, target: gl.TEXTURE_2D },
    depth: gl.DEPTH_COMPONENT16 // Automatically use renderbuffer
  });
  let sobelShader = renderer.shaders.create(
    require('../shader/screen.vert'), require('../shader/sobel.frag')
  );

  let box = renderer.geometries.create(calcNormals(boxGeom()));
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();

  loadWait(inTexture, () => {
    // Bake sobel filter
    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1])
      },
      framebuffer: {
        framebuffer, color: { texture: outTexture, target: gl.TEXTURE_2D }
      },
      shader: sobelShader,
      geometry: quad,
      uniforms: {
        uTexture: inTexture,
        uTextureOffset: [1/1024, 1/1024]
      }
    });
    outTexture.generateMipmap();
  });

  return (delta, context) => {
    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: Object.assign({}, context.camera, {
        uPointLight: [{
          position: [0, 0, 8],
          color: '#ffffff',
          intensity: [1, 0, 0, 0.00015]
        }]
      }),
      passes: [{
        shader: shader,
        geometry: box,
        uniforms: {
          uModel: model1Mat,
          uNormal: model1Normal,
          uMaterial: {
            ambient: '#ffffff',
            diffuse: '#000000',
            specular: '#000000',
            shininess: 30
          },
          uDiffuseMap: outTexture
        }
      }]
    });
  };
}
