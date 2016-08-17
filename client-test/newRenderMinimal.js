import Renderer from 'webglue/renderer';
import BoxGeometry from 'webglue/geom/boxGeometry';
import { mat4 } from 'gl-matrix';

let canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 800;
canvas.height = 600;
let gl = canvas.getContext('webgl', { antialias: false }) ||
  canvas.getContext('experimental-webgl');

let renderer = new Renderer(gl);

// Init basic textures and geometries
// let texture = renderer.textures.fromImage(require('./texture/1.jpg'));
// We'd need specifiying 'capability', but we'll do that later.
let shader = renderer.shaders.create(
  require('./shader/texCoordTest.vert'),
  require('./shader/texCoordTest.frag')
);
let geometry = renderer.geometries.create(new BoxGeometry());
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
mat4.translate(viewMat, viewMat, new Float32Array([0, 0, -10]));

let model1Mat = mat4.create();
let model2Mat = mat4.create();

mat4.translate(model2Mat, model2Mat, new Float32Array([0, 2, 2]));

function animate() {
  mat4.rotateY(model1Mat, model1Mat, Math.PI / 60);
  // And provide sample data
  renderer.render([{
    options: {
      clearColor: new Float32Array([0, 0, 0, 1]),
      clearDepth: 1,
      // clearStencil: 0,
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
    }],
    // null means main framebuffer
    output: null
  }]);
  window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
