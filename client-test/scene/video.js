import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';

import { mat3, mat4 } from 'gl-matrix';

export default function video(renderer) {
  const gl = renderer.gl;
  let box = renderer.geometries.create(calcNormals(boxGeom()));
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );
  var video = document.createElement('video');
  video.src = require('../texture/videoTex.mp4');
  video.autoPlay = true;
  video.play();
  let texture = renderer.textures.create(video, {
    params: {
      minFilter: gl.LINEAR,
      mipmap: false
    }
  });

  let normalMat = mat3.create();
  let modelMat = mat4.create();
  mat4.scale(modelMat, modelMat, [4/3, 1, 1]);
  mat3.normalFromMat4(normalMat, modelMat);

  return (delta, context) => {
    texture.valid = false;
    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL,
        dither: true
      },
      uniforms: Object.assign({}, context.camera, {
        uPointLight: [{
          position: [0, 3, 5],
          color: '#ffffff',
          intensity: [0.3, 0.7, 0.5, 0.00015]
        }]
      }),
      passes: [{
        shader: shader,
        geometry: box,
        uniforms: {
          uModel: modelMat,
          uNormal: normalMat,
          uMaterial: {
            ambient: '#ffffff',
            diffuse: '#ffffff',
            specular: '#555555',
            shininess: 30
          },
          uDiffuseMap: texture
        }
      }]
    });
  };
}
