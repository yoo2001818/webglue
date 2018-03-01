import calcNormals from 'webglue/geom/calcNormals';
import calcTangents from 'webglue/geom/calcTangents';
import quadGeom from 'webglue/geom/quad';

import Filter from 'webglue/filter';

import { mat3, mat4 } from 'gl-matrix';

export default function webcam(renderer) {
  const gl = renderer.gl;

  let quad = renderer.geometries.create(
    calcTangents(calcNormals(quadGeom(256, 144)))
  );
  let blurHeightMap = renderer.textures.create(null, {
    width: 640,
    height: 360,
    params: {
      minFilter: gl.LINEAR,
      mipmap: false
    }
  });
  let normalMap = renderer.textures.create(null, {
    width: 640,
    height: 360,
    params: {
      minFilter: gl.LINEAR,
      mipmap: false
    }
  });
  let shader = renderer.shaders.create(
    require('../shader/phongHeightMap.vert'),
    require('../shader/phong.frag')
  );

  let calcNormal = new Filter(renderer,
    require('../shader/heightToNormal.frag'));
  let blur = new Filter(renderer,
    require('../shader/blur2.frag'));

  var mediaPromise = navigator.mediaDevices.getUserMedia({ video: {
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }})
  .then(stream => {
    let video = document.createElement('video');
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => video.play());
    return video;
  });

  // TODO We need polyfills
  let texture = renderer.textures.create(mediaPromise, {
    width: 1280,
    height: 720,
    params: {
      minFilter: gl.LINEAR,
      mipmap: false
    }
  });

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();
  mat4.scale(model1Mat, model1Mat, [100 * 16 / 9, 20, 100]);
  mat4.rotateX(model1Mat, model1Mat, -Math.PI / 2);
  mat3.normalFromMat4(model1Normal, model1Mat);

  let timer = 0;
  return (delta, context) => {
    timer ++;
    if (timer % 2 === 0) texture.valid = false;
    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL,
        dither: true
      },
      uniforms: Object.assign({}, context.camera, {
        uPointLight: [{}],
        uDirectionalLight: {
          direction: [0, 1, 0],
          color: '#ffffff',
          intensity: [0.3, 0.6, 0.5]
        }
      }),
      passes: [
        blur.get(texture, normalMap, {
          uTextureOffset: [1/1280, 1/720],
          uDirection: [1, 0]
        }),
        blur.get(normalMap, blurHeightMap, {
          uTextureOffset: [1/1280, 1/720],
          uDirection: [0, 1]
        }),
        calcNormal.get(blurHeightMap, normalMap, {
          uScale: 1/5, uTextureOffset: [1/640, 1/360]
        }),
        {
          shader: shader,
          uniforms: {
            uModel: model1Mat,
            uNormal: model1Normal,
            uMaterial: {
              ambient: '#ffffff',
              diffuse: '#aaaaaa',
              specular: '#444444',
              reflectivity: '#8c444444',
              shininess: 200
            },
            uHeightTerrainMap: blurHeightMap,
            uNormalMap: normalMap,
            uDiffuseMap: texture
          },
          geometry: quad
        }
      ]
    });
  };
}
