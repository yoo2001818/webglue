import loadOBJ from 'webglue/loader/obj';
import channelGeom from 'webglue/geom/channel';
import calcNormals from 'webglue/geom/calcNormals';
import transformGeom from 'webglue/geom/transform';
import boxGeom from 'webglue/geom/box';
import quadGeom from 'webglue/geom/quad';

import Camera, { orthogonal } from 'webglue/camera';

import { quat, vec3, mat3, mat4 } from 'gl-matrix';

function quatLookAt(out, front, up) {
  let zFront = vec3.create();
  vec3.normalize(zFront, front);
  // vec3.scale(zFront, zFront, -1);
  let right = vec3.create();
  vec3.cross(right, up, zFront);
  vec3.normalize(right, right);
  if (vec3.length(right) < 0.0001) {
    right = [1, 0, 0];
  }
  let yUp = vec3.create();
  vec3.cross(yUp, zFront, right);
  let mat = [
    right[0], right[1], right[2],
    yUp[0], yUp[1], yUp[2],
    zFront[0], zFront[1], zFront[2]
    /* right[0], yUp[0], zFront[0],
    right[1], yUp[1], zFront[1],
    right[2], yUp[2], zFront[2] */
  ];
  quat.fromMat3(out, mat);
}

export default function shadow(renderer) {
  const gl = renderer.gl;

  let shaders = new Map();
  function shaderHandler(shader, uniforms, renderer) {
    if (shaders.has(shader)) return shaders.get(shader);
    let newShader = renderer.shaders.create(
      shader.source.vert,
      require('../shader/shadow.frag'),
      true
    );
    shaders.set(shader, newShader);
    return newShader;
  }

  let originalData = channelGeom(loadOBJ(require('../geom/wt-teapot.obj')));
  let teapot = renderer.geometries.create(originalData);
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );

  let quad = renderer.geometries.create(transformGeom(calcNormals(quadGeom()), {
    aTexCoord: [
      2, 0,
      0, 2
    ]
  }));
  let floorTexture = renderer.textures.create(require('../texture/wood4.jpg'), {
    params: {
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT
    }
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

  let shadowMapShader = renderer.shaders.create(
    require('../shader/pip.vert'),
    require('../shader/texture.frag')
  );

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

  let fxaaShader = renderer.shaders.create(
    require('../shader/screen.vert'),
    require('../shader/fxaaShadow.frag')
  );

  let shadowFxaaMap = renderer.textures.create(null, shadowMapOptions);

  let blurShader = renderer.shaders.create(
    require('../shader/screen.vert'),
    require('../shader/blurShadow.frag')
  );

  let shadowBlurMap = renderer.textures.create(null, shadowMapOptions);
  let shadowBlurFramebuffer = renderer.framebuffers.create({
    color: shadowBlurMap
  });

  let lightCamera = new Camera(orthogonal(1.5, 1.5, 15.5));

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();

  let floorMat = mat4.create();
  let floorNormal = mat3.create();

  mat4.scale(floorMat, floorMat, [3.5, 3.5, 3.5]);
  mat4.rotateX(floorMat, floorMat, -Math.PI / 2);
  mat3.normalFromMat4(floorNormal, floorMat);

  let timer = 0;
  return (delta, context) => {
    timer += delta;
    let pos = [Math.sin(timer), 1, Math.cos(timer)];
    vec3.normalize(pos, pos);
    quatLookAt(lightCamera.transform.rotation,
      pos, [0, 1, 0]);
    vec3.transformQuat(lightCamera.transform.position,
      [0, 0, 4], lightCamera.transform.rotation);
    lightCamera.transform.invalidate();
    // mat4.rotateY(model1Mat, model1Mat, Math.PI * delta / 1000 / 2);
    // mat3.normalFromMat4(model1Normal, model1Mat);
    let world = [{
      shader: shader,
      geometry: teapot,
      uniforms: {
        uModel: model1Mat,
        uNormal: model1Normal,
        uEnvironmentMap: skybox,
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
        uModel: floorMat,
        uNormal: floorNormal,
        uDiffuseMap: floorTexture,
        uEnvironmentMap: skybox,
        uMaterial: {
          ambient: '#ffffff',
          diffuse: '#999999',
          specular: '#222222',
          reflectivity: '#5352514F',
          shininess: 30
        }
      }
    }];
    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: Object.assign({}, context.camera, {
        uDirectionalLight: {
          direction: pos,
          color: '#aaaaaa',
          intensity: [0.3, 1.0, 1.0],
          shadowMatrix: () => lightCamera.getPV()
        },
        uPointLight: [],
        uDirectionalLightShadowMap: shadowBlurMap
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
        shaderHandler,
        framebuffer: shadowFramebuffer,
        passes: world
      }, {
        options: {
          depth: false
        },
        geometry: quad,
        passes: [{
          framebuffer: {
            color: shadowFxaaMap, framebuffer: shadowBlurFramebuffer
          },
          uniforms: {
            uTexture: shadowMap,
            uTextureOffset: [1/128, 1/128]
          },
          shader: fxaaShader
        }, {
          framebuffer: {
            color: shadowBlurMap, framebuffer: shadowBlurFramebuffer
          },
          uniforms: {
            uTexture: shadowFxaaMap,
            uTextureOffset: [1/128, 1/128]
          },
          shader: blurShader
        }]
      }, world, {
        shader: skyboxShader,
        geometry: box,
        options: {
          cull: gl.FRONT
        },
        uniforms: {
          uSkybox: skybox
        }
      }, {
        shader: shadowMapShader,
        geometry: quad,
        options: {
          depth: false
        },
        uniforms: {
          uScreenSize: shader => [
            shader.renderer.width, shader.renderer.height
          ],
          uTextureSize: [128, 128],
          uTexture: shadowBlurMap
        }
      }]
    });
  };
}
