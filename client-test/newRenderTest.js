// New renderer test...
// Renderer is 'minimal' IR for 'high-level' interface. Or not.
import Renderer from 'webglue/webgl/renderer';

// Let's pretend that we've loaded a renderer object
let renderer = new Renderer();
// Add 'intermediate' output. Since it 'glues' to the screen size, use
// createScreen method.
let outTexture = renderer.textures.createScreen();
// Create Framebuffer along with Renderbuffer. If renderbuffer is specified,
// a new one will be created - with depth.
let worldOutput = renderer.outputs.create(outTexture);
// Making shader like this..?
let redShader = renderer.shaders.create('...');
// Making geometry like this....???
let geometry = renderer.geometries.create('...');

// And provide sample data
renderer.render([
  // Each represents a render task
  {
    options: {
      clearColor: '#000000',
      clearDepth: 1
      // clearStencil: 0
    },
    // Global uniforms... such as VP matrix and lights
    uniforms: {
      uView: new Float32Array(16),
      uLight: [{
        position: new Float32Array(3) // and etc
      }]
    },
    // Global shader defines... Shaders may use this to get GL capabilities,
    // etc.
    defines: {
      lightSize: 1
    },
    // Mesh data. It may be changed later..
    meshes: [{
      shader: redShader,
      uniforms: {
        uColor: 0xFFFF00
      },
      defines: {
        useColor: true
      },
      geometries: [{
        geometry: geometry,
        passes: [{
          attributes: {
            // It should be 'boxed' to prevent unnecessary reuploading
            aInstancePos: new Float32Array(48)
          },
          uniforms: {
            uLocalColor: 0x00FF00
          }
        }, {
          uniforms: {
            uLocalColor: 0x00FF00,
            uPosition: new Float32Array(3)
          }
        }]
      }]
    }],
    output: worldOutput
  }, {
    options: {
      clearColor: '#000000',
      clearDepth: 1
      // clearStencil: 0
    },
    meshes: [{
      shader: redShader,
      uniforms: {
        uTexture: outTexture
      },
      geometries: [{
        geometry: geometry,
        passes: [{}]
      }]
    }],
    // null means main framebuffer
    output: null
  }
]);
