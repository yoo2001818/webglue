import Renderer from 'webglue/renderer';
import UniQuadGeometry from 'webglue/geom/uniQuadGeometry';
import BoxGeometry from 'webglue/geom/boxGeometry';
import UVSphereGeometry from 'webglue/geom/uvSphereGeometry';
import { mat4 } from 'gl-matrix';

let canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 800;
canvas.height = 600;
let gl = canvas.getContext('webgl', { antialias: false, stencil: true }) ||
  canvas.getContext('experimental-webgl');

let renderer = new Renderer(gl);

// Init basic textures and geometries
// let texture = renderer.textures.fromImage(require('./texture/1.jpg'));
// We'd need specifiying 'capability', but we'll do that later.
let shader = renderer.shaders.create(
  require('./shader/texCoordTest.vert'),
  require('./shader/texCoordTest.frag')
);
let screenShader = renderer.shaders.create(
  require('./shader/screen.vert'),
  require('./shader/monoColor.frag')
);

let geometry = renderer.geometries.create(new BoxGeometry());
let uvGeometry = renderer.geometries.create(new UVSphereGeometry(16, 20));
let quadGeometry = renderer.geometries.create(new UniQuadGeometry());
/*let geometry = renderer.geometries.create({
  attributes: {
    aTexCoord: {
      axis: 2,
      data: new Float32Array([
        0, 0, 0, 1, 1, 1, 1, 0
      ])
    }
  },
  indices: new Uint16Array([
    0, 1, 2, 2, 3, 0
  ]),
  mode: gl.TRIANGLES
});*/

let projMat = mat4.create();
mat4.perspective(projMat, Math.PI / 180 * 70, 800/600, 0.1, 20);
let viewMat = mat4.create();
mat4.translate(viewMat, viewMat, new Float32Array([0, 0, -5]));

let model1Mat = mat4.create();
let model2Mat = mat4.create();
let uvMat = mat4.create();

mat4.translate(model2Mat, model2Mat, new Float32Array([0, 2, 2]));

mat4.translate(uvMat, uvMat, new Float32Array([0, 0, 2]));

let prevTime = -1;
let timer = 0;

function animate(time) {
  if (prevTime === -1) prevTime = time;
  let delta = time - prevTime;
  prevTime = time;
  timer += delta / 1000;
  mat4.rotateY(model1Mat, model1Mat, Math.PI / 60);
  mat4.identity(uvMat);
  mat4.translate(uvMat, uvMat, new Float32Array([
    Math.cos(timer * 5), Math.sin(timer * 5),
    Math.cos(timer) * 2 + 1]));
  // And provide sample data
  renderer.render([{
    options: {
      clearColor: new Float32Array([0, 0, 0, 1]),
      clearDepth: 1,
      clearStencil: 0,
      cull: gl.BACK,
      depth: gl.LEQUAL
    },
    uniforms: {
      uProjection: projMat,
      uView: viewMat
    },
    passes: [{
      shader: shader,
      uniforms: {
        uScale: 0.5
      },
      passes: [{
        geometry: uvGeometry,
        uniforms: {
          uModel: uvMat
        },
        options: {
          stencil: {
            func: [gl.ALWAYS, 1, 0xFF],
            op: [gl.KEEP, gl.KEEP, gl.REPLACE],
            mask: 0xFF
          },
          colorMask: [true, true, true, true],
          depthMask: true
        },
        draw: true
      }, {
        options: {
          stencil: {
            func: [gl.EQUAL, 1, 0xFF],
            mask: 0
          }
        },
        geometry: geometry,
        passes: [{
          uniforms: {
            uTint: new Float32Array([0, 0, 1, 1]),
            uModel: model1Mat
          },
          draw: true
        }, {
          uniforms: {
            uModel: model2Mat
          },
          draw: true
        }]
      }]
    }, {
      options: {
        stencil: {
          func: [gl.NOTEQUAL, 1, 0xFF],
          mask: 0
        }
      },
      shader: screenShader,
      uniforms: {
        uColor: new Float32Array([1, 1, 1])
      },
      geometry: quadGeometry,
      draw: true
    }],
    // null means main framebuffer
    output: null
  }]);
  window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
