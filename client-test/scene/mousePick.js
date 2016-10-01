import boxGeom from 'webglue/geom/box';
import calcNormals from 'webglue/geom/calcNormals';

import MeshTransform from 'webglue/meshTransform';

import { vec2, vec3, vec4 } from 'gl-matrix';

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

  let align = true;
  let alignColor = '#ff0000';
  let alignDir = [1, 0, 0];

  let alignGeom = renderer.geometries.create({
    attributes: {
      aPosition: [[-1, 0, 0], [1, 0, 0]]
    },
    mode: gl.LINES
  });

  let selectedId = 0;
  let contextCache;
  let mouseDown = false;
  let mousePosX = 0;
  let mousePosY = 0;
  let relativeOffset = vec2.create();
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
        passes: [meshList.map((data, id) => ({
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
        })), align && meshList[selectedId] != null && {
          shader: pickShader,
          geometry: alignGeom,
          uniforms: {
            uColor: alignColor,
            uModel: [
              alignDir[0] * 1000, alignDir[1] * 1000, alignDir[2] * 1000, 0,
              0, 0, 0, 0,
              0, 0, 0, 0,
              meshList[selectedId].transform.position[0],
              meshList[selectedId].transform.position[1],
              meshList[selectedId].transform.position[2],
              1
            ]
          }
        }]
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
      if (meshList[selectedId] == null) return;
      if (align) {
        // We're aligning to axis - Get relative offset from origin to clicked
        // point
        let transform = meshList[selectedId].transform;
        // Project current model position to projection space
        // (to get Z value)
        let perspPos = vec4.fromValues(0, 0, 0, 1);
        vec4.transformMat4(perspPos, perspPos, transform.get());
        vec4.transformMat4(perspPos, perspPos, contextCache.cameraObj.getPV());
        vec4.scale(perspPos, perspPos, 1 / perspPos[3]);
        // Last, store relative offset for future use
        vec2.subtract(relativeOffset, ndc, perspPos);
      }
    },
    keydown(e) {
      if (e.keyCode === 67) {
        align = false;
      } else if (e.keyCode === 88) {
        align = true;
        alignColor = '#ff0000';
        alignDir = [1, 0, 0];
      } else if (e.keyCode === 89) {
        align = true;
        alignColor = '#00ff00';
        alignDir = [0, 1, 0];
      } else if (e.keyCode === 90) {
        align = true;
        alignColor = '#0000ff';
        alignDir = [0, 0, 1];
      }
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
      if (!align) {
        // Freestyle translation
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
        vec3.copy(transform.position, perspPos);
        transform.invalidate();
      } else {
        // How much should it move in viewport space in order to move (1, 0, 0)?
        let transform = meshList[selectedId].transform;
        // Project current model position to projection space
        let perspPos = vec4.fromValues(0, 0, 0, 1);
        vec4.transformMat4(perspPos, perspPos, transform.get());
        let addedPos = vec4.create();
        addedPos[3] = 1;
        vec3.add(addedPos, perspPos, alignDir);
        vec4.transformMat4(perspPos, perspPos, contextCache.cameraObj.getPV());
        vec4.transformMat4(addedPos, addedPos, contextCache.cameraObj.getPV());
        let centerPos = vec2.create();
        vec2.copy(centerPos, perspPos);
        vec2.scale(centerPos, centerPos, 1 / perspPos[3]);
        let dirPos = vec2.create();
        vec2.copy(dirPos, addedPos);
        vec2.scale(dirPos, dirPos, 1 / addedPos[3]);
        vec2.subtract(dirPos, dirPos, centerPos);
        let dirNorm = vec2.create();
        vec2.normalize(dirNorm, dirPos);
        // Now we've got everything, calculated required transform length
        // and translate to it
        let projected = vec2.create();
        vec2.subtract(projected, ndc, centerPos);
        vec2.subtract(projected, projected, relativeOffset);
        let dist = vec2.dot(projected, dirNorm);
        let transSize = dist / vec2.length(dirPos);
        let translation = vec3.create();
        vec3.copy(translation, alignDir);
        vec3.scale(translation, translation, transSize);
        vec3.add(transform.position, transform.position, translation);
        transform.invalidate();
      }
    }
  };
}
