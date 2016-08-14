import Renderer from 'webglue/webgl/renderer';

let canvas = document.createElement('canvas');
document.body.appendChild(canvas);
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

// And provide sample data
renderer.render([{
  options: {
    clearColor: '#000000',
    clearDepth: 1,
    // clearStencil: 0,
    cull: gl.BACK
  },
  passes: [{
    shader: shader,
    uniforms: {},
    geometries: [{
      geometry: geometry,
      passes: [{}]
    }]
  }],
  // null means main framebuffer
  output: null
}]);
