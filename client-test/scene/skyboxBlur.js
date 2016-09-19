import calcNormals from 'webglue/geom/calcNormals';
import calcTangents from 'webglue/geom/calcTangents';
import boxGeom from 'webglue/geom/box';

import onLoad from 'webglue/util/onLoad';

import { mat3, mat4 } from 'gl-matrix';

// Oh god
function renderCubeTexture(gl, framebuffer, texture, pass) {
  let right = 0x8515;

  let projection = mat4.create();
  let view = mat4.create();
  // near / far value doesn't matter at all :/
  mat4.perspective(projection, Math.PI / 2, 1, 0.1, 100);
  return {
    uniforms: { uProjection: projection },
    passes: [{ // Right
      uniforms: {
        uView: () => mat4.fromYRotation(view, Math.PI / 2)
      },
      framebuffer: { framebuffer, color: { texture, target: right }},
      passes: pass
    }, { // Left
      uniforms: {
        uView: () => mat4.fromYRotation(view, -Math.PI / 2)
      },
      framebuffer: { framebuffer, color: { texture, target: right + 1 }},
      passes: pass
    }, { // Up
      uniforms: {
        uView: () => mat4.fromXRotation(view, Math.PI / 2)
      },
      framebuffer: { framebuffer, color: { texture, target: right + 2 }},
      passes: pass
    }, { // Down
      uniforms: {
        uView: () => mat4.fromXRotation(view, -Math.PI / 2)
      },
      framebuffer: { framebuffer, color: { texture, target: right + 3 }},
      passes: pass
    }, { // Front
      uniforms: {
        uView: () => mat4.identity(view)
      },
      framebuffer: { framebuffer, color: { texture, target: right + 4 }},
      passes: pass
    }, { // Back
      uniforms: {
        uView: () => mat4.fromYRotation(view, Math.PI)
      },
      framebuffer: { framebuffer, color: { texture, target: right + 5 }},
      passes: pass
    }]
  };
}

export default function skyboxBlur(renderer) {
  const gl = renderer.gl;

  let box = renderer.geometries.create(calcTangents(calcNormals(boxGeom())));
  let skyboxInput = renderer.textures.create({
    source: [
      require('../texture/stormyday/front.jpg'),
      require('../texture/stormyday/back.jpg'),
      require('../texture/stormyday/down.jpg'),
      require('../texture/stormyday/up.jpg'),
      require('../texture/stormyday/right.jpg'),
      require('../texture/stormyday/left.jpg')
    ],
    params: {
      minFilter: gl.LINEAR,
      mipmap: false
    }
  });
  let skyboxOutput = renderer.textures.create({
    source: [],
    width: 64,
    height: 64,
    params: {
      minFilter: gl.LINEAR,
      mipmap: false
    }
  });
  let framebuffer = renderer.framebuffers.create({
    color: skyboxOutput
  });
  let skyboxBlurShader = renderer.shaders.create(
    require('../shader/skyboxBlur.vert'),
    require('../shader/skyboxBlur.frag')
  );
  let skyboxShader = renderer.shaders.create(
    require('../shader/skybox.vert'),
    require('../shader/skybox.frag')
  );

  onLoad(skyboxInput, () => {
    renderer.render({
      shader: skyboxBlurShader,
      geometry: box,
      uniforms: {
        uSkybox: skyboxInput
      },
      passes: renderCubeTexture(gl, framebuffer, skyboxOutput, {})
    });
  });

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
      uniforms: context.camera,
      passes: [{
        shader: skyboxShader,
        geometry: box,
        options: {
          cull: gl.FRONT
        },
        uniforms: {
          uSkybox: skyboxOutput
        }
      }]
    });
  };
}
