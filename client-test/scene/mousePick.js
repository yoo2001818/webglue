import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';

import MeshTransform from 'webglue/meshTransform';

import { vec4 } from 'gl-matrix';

function packColor(id) {
  // Get R, G, B, A (using little endian)
  // Why do we use Float32Array? Because it's OpenGL.
  let output = new Float32Array(4);
  output[0] = (id & 0xFF) / 256;
  output[1] = ((id >>> 8) & 0xFF) / 256;
  output[2] = ((id >>> 16) & 0xFF) / 256;
  output[3] = ((id >>> 24) & 0xFF) / 256;
  return output;
}

function unpackColor(data) {
  let output = 0;
  output |= data[0];
  output |= data[1] << 8;
  output |= data[2] << 16;
  output |= data[3] << 24;
  return output;
}

export default function mousePick(renderer) {
  const gl = renderer.gl;
  // Generate box data we need
  // We're literally spamming drawing calls - but it doesn't matter because
  // that's not in the scope of this example.
  let meshList = [];
  for (let i = 0; i < 100; ++i) {
    let transform = new MeshTransform();
    transform.translate([
      Math.random() * 30 - 15,
      Math.random() * 30 - 15,
      Math.random() * 30 - 15
    ]);
    meshList.push({
      transform: transform,
      color: packColor(i)
    });
  }
  let box = renderer.geometries.create(calcNormals(boxGeom()));
  let texture = renderer.textures.create(require('../texture/2.png'));
  let borderShader = renderer.shaders.create(
    require('../shader/minimalBias.vert'),
    require('../shader/monoColor.frag')
  );
  let pickShader = renderer.shaders.create(
    require('../shader/minimal.vert'),
    require('../shader/monoColor.frag')
  );
  let shader = renderer.shaders.create(
    require('../shader/phong.vert'),
    require('../shader/phong.frag')
  );

  let pickTexture = renderer.textures.create(null, {
    format: gl.RGBA
  });
  let pickFramebuffer = renderer.framebuffers.create({
    color: pickTexture,
    depth: gl.DEPTH_COMPONENT16 // Automatically use renderbuffer
  });

  let selectedId = 0;
  let contextCache;
  let mouseDown = false;
  let mousePosX = 0;
  let mousePosY = 0;
  return {
    update(delta, context) {
      contextCache = context;
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
            direction: [0, 0.7 / 1.22, 1 / 1.22],
            color: '#aaaaaa',
            intensity: [0.3, 1.0, 1.0]
          }
        }),
        passes: meshList.map((data, id) => ({
          shader: shader,
          geometry: box,
          uniforms: {
            uMaterial: {
              ambient: '#ffffff',
              diffuse: '#ffffff',
              specular: '#555555',
              shininess: 30
            },
            uDiffuseMap: texture,
            uModel: data.transform.get,
            uNormal: data.transform.getNormal
          },
          passes: id === selectedId ? [{
            options: {
              // depthMask: true,
              cull: gl.FRONT
            },
            uniforms: {
              uBias: [0.1, 0],
              uColor: '#ffffff'
            },
            shader: borderShader
          }, {}] : [{}]
        }))
      });
    },
    mousedown(e, ndc) {
      if (e.button !== 0) return;
      // Render mouse pick data
      renderer.render({
        options: {
          clearColor: new Float32Array([1, 1, 1, 1]),
          clearDepth: 1,
          cull: gl.BACK,
          depth: gl.LEQUAL
        },
        uniforms: contextCache.camera,
        passes: meshList.map(data => ({
          shader: pickShader,
          geometry: box,
          uniforms: {
            uColor: data.color,
            uModel: data.transform.get,
            uNormal: data.transform.getNormal
          }
        })),
        framebuffer: pickFramebuffer
      });
      // Get mouse pixel
      let pixel = new Uint8Array(4);
      pickFramebuffer.readPixelsRGBA(e.clientX,
        gl.drawingBufferHeight - e.clientY, 1, 1, pixel);
      selectedId = unpackColor(pixel);
      mousePosX = ndc[0];
      mousePosY = ndc[1];
      mouseDown = true;
    },
    mouseup() {
      mouseDown = false;
    },
    mousemove(e, ndc) {
      if (!mouseDown) return;
      let deltaX = ndc[0] - mousePosX;
      let deltaY = ndc[1] - mousePosY;
      mousePosX = ndc[0];
      mousePosY = ndc[1];
      if (meshList[selectedId] == null) return;
      let transform = meshList[selectedId].transform;
      // Project current model position to projection space
      let perspPos = vec4.fromValues(0, 0, 0, 1);
      vec4.transformMat4(perspPos, perspPos, transform.get());
      vec4.transformMat4(perspPos, perspPos, contextCache.cameraObj.getPV());
      // Then move using delta value
      perspPos[0] += deltaX * perspPos[3];
      perspPos[1] += deltaY * perspPos[3];
      // Inverse-project to world space
      vec4.transformMat4(perspPos, perspPos, contextCache.cameraObj.
        getInverseProjection());
      vec4.transformMat4(perspPos, perspPos, contextCache.cameraObj.
        transform.get());
      // Last, write the pos to transform
      transform.position[0] = perspPos[0];
      transform.position[1] = perspPos[1];
      transform.position[2] = perspPos[2];
      transform.invalidate();
    }
  };
}
