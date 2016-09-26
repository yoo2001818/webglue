import loadOBJ from 'webglue/loader/obj';
import channelGeom from 'webglue/geom/channel';
import calcNormals from 'webglue/geom/calcNormals';
import transformGeom from 'webglue/geom/transform';
import boxGeom from 'webglue/geom/box';
import quadGeom from 'webglue/geom/quad';

import Camera, { orthogonal } from 'webglue/camera';

import { quat, mat3, mat4 } from 'gl-matrix';

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

  let shadowMap = renderer.textures.create(null, {
    width: 512,
    height: 512,
    params: {
      mipmap: false,
      minFilter: gl.LINEAR
    }
  });
  let shadowFramebuffer = renderer.framebuffers.create({
    color: shadowMap,
    depth: gl.DEPTH_COMPONENT16 // Automatically use renderbuffer
  });

  let lightCamera = new Camera(orthogonal(4, 0.5, 5.5));
  quat.rotateX(lightCamera.transform.rotation,
    lightCamera.transform.rotation, Math.PI / -2);
  lightCamera.transform.position[1] = 5;
  lightCamera.transform.invalidate();

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
          direction: [0, 1, 0],
          color: '#aaaaaa',
          intensity: [0.3, 1.0, 1.0],
          shadowMatrix: () => lightCamera.getPV()
        },
        uPointLight: [],
        uDirectionalLightShadowMap: shadowMap
      }),
      passes: [{
        options: {
          clearColor: new Float32Array([0, 0, 0, 1]),
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
          uTextureSize: [512, 512],
          uTexture: shadowMap
        }
      }]
    });
  };
}
