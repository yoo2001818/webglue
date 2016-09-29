import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';
import calcTangents from 'webglue/geom/calcTangents';
import quadGeom from 'webglue/geom/quad';

import Filter from 'webglue/filter';

import onLoad from 'webglue/util/onLoad';

import { mat3, mat4 } from 'gl-matrix';

export default function heightMap(renderer) {
  const gl = renderer.gl;
  let quad = renderer.geometries.create(
    calcTangents(calcNormals(quadGeom(32, 32)))
  );
  let heightMap = renderer.textures.create(
    require('../texture/heightmap.png'), {
      params: {
        minFilter: gl.LINEAR,
        mipmap: false
      }
    }
  );
  let normalMap = renderer.textures.create(null, {
    width: 256,
    height: 256,
    params: {
      minFilter: gl.LINEAR,
      mipmap: false
    }
  });
  let blurNormalMap = renderer.textures.create(null, {
    width: 256,
    height: 256,
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
    require('../shader/blur.frag'));
  onLoad(heightMap, () => {
    renderer.render([
      calcNormal.get(heightMap, normalMap, {
        uScale: 1/2, uTextureOffset: [1/64, 1/64]
      }),
      blur.get(normalMap, blurNormalMap, {
        uTextureOffset: [1/256, 1/256]
      })
    ]);
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

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();
  mat4.scale(model1Mat, model1Mat, [100, 50, 100]);
  mat4.rotateX(model1Mat, model1Mat, -Math.PI / 2);
  mat3.normalFromMat4(model1Normal, model1Mat);

  let timer = 0;
  return (delta, context) => {
    timer += delta;
    // mat4.rotateY(model1Mat, model1Mat, Math.PI * delta / 1000 / 2);
    // mat3.normalFromMat4(model1Normal, model1Mat);

    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: Object.assign({}, context.camera, {
        uPointLight: [],
        uDirectionalLight: {
          direction: [0, 1, 0],
          color: '#ffffff',
          intensity: [0.3, 0.7, 1.0]
        },
        uEnvironmentMap: skybox
      }),
      passes: [{
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
          uHeightTerrainMap: heightMap,
          uNormalMap: blurNormalMap,
          uDiffuseMap: blurNormalMap
        },
        geometry: quad
      }, {
        shader: skyboxShader,
        geometry: box,
        options: {
          cull: gl.FRONT
        },
        uniforms: {
          uSkybox: skybox
        }
      }]
    });
  };
}
