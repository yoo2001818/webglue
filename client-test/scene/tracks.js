import loadOBJ from 'webglue/loader/obj';
import channelGeom from 'webglue/geom/channel';

import { mat3, mat4, vec3 } from 'gl-matrix';

function getFront(out, prev, current) {
  vec3.subtract(out, current, prev);
  vec3.normalize(out, out);
}

function getRight(out, front) {
  vec3.cross(out, front, [0, 1, 0]);
}

function getUp(out, front, right) {
  vec3.cross(out, right, front);
}

export default function tracks(renderer) {
  const gl = renderer.gl;

  let texture = renderer.textures.create(
    require('../texture/track-diffuse.png')
  );

  let track = renderer.geometries.create(
    channelGeom(loadOBJ(require('../geom/track.obj')))
  );
  let lerpTimer = -1;
  let lerpAccel = 0;
  let buffer, geom;
  let geometries = [];

  function createStroke() {
    buffer = renderer.geometries.createBuffer([]);
    geom = renderer.geometries.create({
      attributes: {
        aPosition: track.attributes.aPosition,
        aTexCoord: track.attributes.aTexCoord,
        aNormal: track.attributes.aNormal,
        aTangent: track.attributes.aTangent,
        aStart: {
          buffer, offset: 0, axis: 3, stride: 36, instanced: 1
        },
        aEnd: {
          buffer, offset: 36, axis: 3, stride: 36, instanced: 1
        },
        aStartRight: {
          buffer, offset: 12, axis: 3, stride: 36, instanced: 1
        },
        aEndRight: {
          buffer, offset: 48, axis: 3, stride: 36, instanced: 1
        },
        aStartUp: {
          buffer, offset: 24, axis: 3, stride: 36, instanced: 1
        },
        aEndUp: {
          buffer, offset: 60, axis: 3, stride: 36, instanced: 1
        }
      },
      indices: track.indices
    });
    geometries.push(geom);
  }

  let shader = renderer.shaders.create(
    require('../shader/phongLine.vert'),
    require('../shader/phong.frag')
  );
  let drawBefore = [];
  let drawing = false;

  let perspRev = mat4.create();
  let model = mat4.create();
  let normal = mat3.create();

  return {
    update(delta, context) {
      if (lerpTimer >= 0 && buffer != null) {
        let pos = lerpTimer | 0;
        let start = buffer.data.subarray(pos * 9, pos * 9 + 3);
        let startRight = buffer.data.subarray(pos * 9 + 3, pos * 9 + 6);
        let startUp = buffer.data.subarray(pos * 9 + 6, pos * 9 + 9);
        let end = buffer.data.subarray((pos + 1) * 9, (pos + 1) * 9 + 3);
        let endRight = buffer.data.subarray(
          (pos + 1) * 9 + 3, (pos + 1) * 9 + 6);
        let endUp = buffer.data.subarray(
          (pos + 1) * 9 + 6, (pos + 1) * 9 + 9);
        // Then lerp... kinda.
        let right = vec3.create();
        vec3.lerp(right, startRight, endRight, lerpTimer % 1);
        let up = vec3.create();
        vec3.lerp(up, startUp, endUp, lerpTimer % 1);
        let eye = vec3.create();
        vec3.lerp(eye, start, end, lerpTimer % 1);
        vec3.add(eye, eye, up);
        let front = vec3.create();
        vec3.cross(front, up, right);
        vec3.normalize(front, front);
        let center = vec3.create();
        vec3.add(center, front, eye);
        // console.log(start, end);
        // Last, create view matrix from these three vectors.
        mat4.lookAt(context.cameraObj.viewMatrix, eye, center, up);
        // context.cameraObj.transform.position.set(eye);
        // context.cameraObj.transform.invalidate();
        lerpAccel += vec3.dot(front, [0, -1, 0]) / 10;
        lerpTimer += delta * 5 * lerpAccel;
        if ((lerpTimer + 1) >= buffer.data.length / 9) {
          lerpTimer = -1;
        }
      }
      renderer.render({
        options: {
          clearColor: '#222222',
          clearDepth: 1,
          cull: gl.BACK,
          depth: gl.LEQUAL
        },
        uniforms: Object.assign({
          uPointLight: [{
            position: [0, 8, 0],
            color: '#ffffff',
            intensity: [0.3, 0.7, 1.0, 0.00015]
          }]
        }, context.camera),
        passes: [{
          shader: shader,
          geometry: geometries,
          uniforms: {
            uColor: '#ffffffff',
            uModel: model,
            uNormal: normal,
            uMaterial: {
              ambient: '#ffffff',
              diffuse: '#ffffff',
              specular: '#444444',
              shininess: 100
            },
            uDiffuseMap: texture
          }
        }]
      });
      mat4.invert(perspRev, context.camera.uProjectionView());
    },
    mousedown(event, ndc) {
      if (event.button !== 0) return;
      lerpTimer = -1;
      drawing = true;
      let pos = vec3.fromValues(ndc[0], ndc[1], 0.987);
      vec3.transformMat4(pos, pos, perspRev);
      drawBefore = pos;
      createStroke();
    },
    mouseup(event) {
      if (event.button !== 0) return;
      drawing = false;
      // Start lerp
      lerpTimer = 0;
      lerpAccel = 1;
    },
    mousemove(event, ndc) {
      if (!drawing) return;
      let pos = vec3.fromValues(ndc[0], ndc[1], 0.987);
      vec3.transformMat4(pos, pos, perspRev);
      if (vec3.distance(drawBefore, pos) < 1) return;
      drawBefore = pos;
      let newArray = new Float32Array(buffer.data.length + 9);
      newArray.set(buffer.data);
      newArray[buffer.data.length] = pos[0];
      newArray[buffer.data.length + 1] = pos[1];
      newArray[buffer.data.length + 2] = pos[2];
      if (buffer.data.length >= 18) {
        let currentFront = vec3.create();
        getFront(currentFront, newArray.subarray(buffer.data.length - 9),
          newArray.subarray(buffer.data.length));
        let prevFront = vec3.create();
        getFront(prevFront, newArray.subarray(buffer.data.length - 18),
          newArray.subarray(buffer.data.length - 9));

        let currentRight = vec3.create();
        let prevRight = vec3.create();
        getRight(currentRight, currentFront);
        getRight(prevRight, prevFront);

        let currentUp = vec3.create();
        let prevUp = vec3.create();
        getUp(currentUp, currentFront, currentRight);
        getUp(prevUp, prevFront, prevRight);

        vec3.lerp(prevRight, prevRight, currentRight, 0.5);
        vec3.lerp(prevUp, prevUp, currentUp, 0.5);
        newArray.set(prevRight, buffer.data.length - 6);
        newArray.set(currentRight, buffer.data.length + 3);
        newArray.set(prevUp, buffer.data.length - 3);
        newArray.set(currentUp, buffer.data.length + 6);
      } else if (buffer.data.length >= 9) {
        let front = vec3.create();
        getFront(front, newArray.subarray(buffer.data.length - 9),
          newArray.subarray(buffer.data.length));

        getRight(newArray.subarray(buffer.data.length - 6), front);
        getRight(newArray.subarray(buffer.data.length + 3), front);

        getUp(newArray.subarray(buffer.data.length - 3), front,
          newArray.subarray(buffer.data.length - 6));
        getUp(newArray.subarray(buffer.data.length + 6), front,
          newArray.subarray(buffer.data.length + 3));
      }
      buffer.update(newArray);
      geom.update({
        attributes: {
          aStart: {
            buffer, offset: 0, axis: 3, stride: 36, instanced: 1
          },
          aEnd: {
            buffer, offset: 36, axis: 3, stride: 36, instanced: 1
          },
          aStartRight: {
            buffer, offset: 12, axis: 3, stride: 36, instanced: 1
          },
          aEndRight: {
            buffer, offset: 48, axis: 3, stride: 36, instanced: 1
          },
          aStartUp: {
            buffer, offset: 24, axis: 3, stride: 36, instanced: 1
          },
          aEndUp: {
            buffer, offset: 60, axis: 3, stride: 36, instanced: 1
          }
        }
      });
    }
  };
}
