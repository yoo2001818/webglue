import loadOBJ from 'webglue/loader/obj';
import channelGeom from 'webglue/geom/channel';
import calcNormals from 'webglue/geom/calcNormals';
import calcTangents from 'webglue/geom/calcTangents';
import transformGeom from 'webglue/geom/transform';
import boxGeom from 'webglue/geom/box';
import quadGeom from 'webglue/geom/quad';

import { vec3 } from 'gl-matrix';

import Camera, { orthogonal } from 'webglue/camera';
import Filter from 'webglue/filter';
import MeshTransform from 'webglue/meshTransform';

function createShaderHandler(frag) {
  let shaders = new Map();
  return function shaderHandler(shader, uniforms, renderer) {
    if (shaders.has(shader)) return shaders.get(shader);
    let newShader = renderer.shaders.create(
      shader.source.vert,
      frag
    );
    shaders.set(shader, newShader);
    return newShader;
  };
}

export default function ssao(renderer) {
  const gl = renderer.gl;

  let shadowHandler = createShaderHandler(require('../shader/shadow.frag'));
  let ssaoHandler = createShaderHandler(require('../shader/preSSAO.frag'));

  let originalData = channelGeom(loadOBJ(require('../geom/wt-teapot.obj')));
  let teapot = renderer.geometries.create(originalData);
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );

  let quad = renderer.geometries.create(transformGeom(
    calcTangents(calcNormals(quadGeom())), {
      aTexCoord: [
        2, 0,
        0, 2
      ]
    })
  );
  let floorTexture = renderer.textures.create(require('../texture/stone.jpg'), {
    params: {
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT
    }
  });
  let floorNormal = renderer.textures.create(
    require('../texture/stone-normal.jpg'), { params: {
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT
    }
  });

  let ssaoTexture = renderer.textures.create(null, {
    format: gl.RGBA,
    params: {
      minFilter: gl.NEAREST,
      magFilter: gl.NEAREST
    },
    width: () => gl.drawingBufferWidth / 2,
    height: () => gl.drawingBufferHeight / 2
  });
  let ssaoOutTexture = renderer.textures.create(null, {
    width: () => gl.drawingBufferWidth / 2,
    height: () => gl.drawingBufferHeight / 2
  });
  let ssaoOutTexture2 = renderer.textures.create(null, {
    width: () => gl.drawingBufferWidth / 2,
    height: () => gl.drawingBufferHeight / 2
  });
  let ssaoFramebuffer = renderer.framebuffers.create({
    color: ssaoTexture,
    depth: gl.DEPTH_COMPONENT16 // Automatically use renderbuffer
  });

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
  let screenShader = renderer.shaders.create(
    require('../shader/screen.vert'),
    require('../shader/fxaa.frag')
  );
  let ssaoFilter = new Filter(renderer, require('../shader/ssao.frag'));
  let ssaoBlurFilter = new Filter(renderer, require('../shader/ssaoBlur.frag'));

  let teapotTransform = new MeshTransform();
  let floorTransform = new MeshTransform();

  floorTransform.setScale([3.5, 3.5, 3.5]);
  floorTransform.rotateX(-Math.PI / 2);

  // Shadow generating code
  let shadowMapOptions = {
    width: 128,
    height: 128,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
    params: {
      minFilter: gl.LINEAR,
      mipmap: false
    }
  };
  let shadowMap = renderer.textures.create(null, shadowMapOptions);
  let shadowFramebuffer = renderer.framebuffers.create({
    color: shadowMap,
    depth: gl.DEPTH_COMPONENT16 // Automatically use renderbuffer
  });
  let fxaaFilter = new Filter(renderer, require('../shader/fxaaShadow.frag'), {
    uTextureOffset: [1/128, 1/128]
  });
  let blurFilter = new Filter(renderer, require('../shader/blurShadow.frag'), {
    uTextureOffset: [1/128, 1/128]
  });
  let shadowFxaaMap = renderer.textures.create(null, shadowMapOptions);
  let lightCamera = new Camera(orthogonal(1.5, 1.5, 15.5));

  let timer = 0;
  return (delta, context) => {
    timer += delta;
    let pos = [Math.sin(timer), 1, Math.cos(timer)];
    vec3.normalize(pos, pos);
    lightCamera.transform.lookAt(pos, [0, 1, 0]);
    vec3.transformQuat(lightCamera.transform.position,
      [0, 0, 5], lightCamera.transform.rotation);

    let worldGraph = [
      {
        shader: shader,
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
        }
      }, {
        shader: shader,
        geometry: quad,
        uniforms: {
          uModel: floorTransform.get,
          uNormal: floorTransform.getNormal,
          uDiffuseMap: floorTexture,
          uNormalMap: floorNormal,
          uMaterial: {
            ambient: '#ffffff',
            diffuse: '#999999',
            specular: '#222222',
            reflectivity: '#5352514F',
            shininess: 30
          }
        }
      }
    ];

    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: Object.assign({}, context.camera, {
        uPointLight: [{
          position: [1.5, 0.8, 1.5],
          color: '#ff0000',
          intensity: [0, 1.0, 1.0, 0.1]
        }, {
          position: [1.5, 0.8, -1.5],
          color: '#0000ff',
          intensity: [0, 1.0, 1.0, 0.1]
        }],
        uDirectionalLight: {
          direction: pos,
          color: '#ffffff',
          intensity: [0.3, 0.7, 1.0],
          shadowMatrix: () => lightCamera.getPV()
        },
        uDirectionalLightShadowMap: shadowMap,
        uEnvironmentMap: skybox,
        uRange: [0.01, 50]
      }),
      passes: [{
        options: {
          clearColor: new Float32Array([1, 1, 1, 1]),
          clearDepth: 1,
          cull: gl.BACK,
          depth: gl.LEQUAL
        },
        uniforms: {
          uProjection: lightCamera.getProjection,
          uView: lightCamera.getView,
          uProjectionView: lightCamera.getPV
        },
        shaderHandler: shadowHandler,
        framebuffer: shadowFramebuffer,
        passes: worldGraph
      }, [
        fxaaFilter.get(shadowMap, shadowFxaaMap),
        blurFilter.get(shadowFxaaMap, shadowMap)
      ], {
        options: {
          clearColor: new Float32Array([0, 0, 1, 1]),
          clearDepth: 1
        },
        framebuffer: ssaoFramebuffer,
        shaderHandler: ssaoHandler,
        passes: worldGraph
      }, {
        shader: skyboxShader,
        geometry: box,
        options: {
          cull: gl.FRONT
        },
        uniforms: {
          uSkybox: skybox
        }
      },
      worldGraph,
      [
        ssaoFilter.get(ssaoTexture, ssaoOutTexture, {
          uTextureOffset: shader => [
            1 / shader.renderer.width, 1 / shader.renderer.height
          ],
          uProjection: context.cameraObj.getProjection,
          uInverseProjection: context.cameraObj.getInverseProjection,
          uRadius: 1/4
        }),
        ssaoBlurFilter.get(ssaoOutTexture, ssaoOutTexture2, {
          uTextureOffset: shader => [
            1 / shader.renderer.width, 1 / shader.renderer.height
          ],
          uDirection: [1, 0],
          uDepthTexture: ssaoTexture
        }),
        ssaoBlurFilter.get(ssaoOutTexture2, ssaoOutTexture, {
          uTextureOffset: shader => [
            1 / shader.renderer.width, 1 / shader.renderer.height
          ],
          uDirection: [0, 1],
          uDepthTexture: ssaoTexture
        })
      ], {
        options: {
          blend: {
            func: [gl.ZERO, gl.SRC_COLOR]
          }
        },
        geometry: quad,
        shader: screenShader,
        uniforms: {
          uTexture: ssaoOutTexture,
          uTextureOffset: shader => [
            1 / ssaoOutTexture.width, 1 / ssaoOutTexture.height
          ]
        }
      }]
    });
  };
}
