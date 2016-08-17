import Renderer from 'webglue/renderer';

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
let geometry = renderer.geometries.create({
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
});

function animate() {
  // And provide sample data
  renderer.render([{
    options: {
      clearColor: new Float32Array([0, 0, 0, 1]),
      clearDepth: 1,
      // clearStencil: 0,
      cull: gl.FRONT,
      depth: gl.LEQUAL
    },
    passes: [{
      shader: shader,
      uniforms: {
        uScale: 0.5,
        uTint: new Float32Array([0, 0, 0, 0])
      },
      geometry: geometry,
      passes: [{
        uniforms: {
          uScale: 1,
          uTint: new Float32Array([0, 0, 1, 1])
        },
        draw: true
      }, { draw: true }]
    }],
    // null means main framebuffer
    output: null
  }]);
  window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
